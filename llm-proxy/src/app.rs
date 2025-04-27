use std::{
    convert::Infallible,
    future::{Ready, ready},
    net::SocketAddr,
    sync::Arc,
    task::{Context, Poll},
};

use axum_server::tls_rustls::RustlsConfig;
use futures::future::BoxFuture;
use meltdown::Token;
use minio_rsc::{Minio, provider::StaticProvider};
use telemetry::tracing::MakeRequestId;
use tower::{ServiceBuilder, buffer::BufferLayer, util::BoxCloneService};
use tower_http::{
    ServiceBuilderExt,
    add_extension::AddExtension,
    auth::AsyncRequireAuthorizationLayer,
    catch_panic::CatchPanicLayer,
    normalize_path::NormalizePathLayer,
    trace::{DefaultMakeSpan, TraceLayer},
};
use tracing::{Level, info};

use crate::{
    config::{
        Config, ProviderKeysSource,
        rate_limit::{AuthedLimiterConfig, UnauthedLimiterConfig},
        server::TlsConfig,
    },
    discover::provider::monitor::ProviderMonitors,
    error::{self, init::InitError, runtime::RuntimeError},
    middleware::auth::AuthService,
    router::meta::MetaRouter,
    store::StoreRealm,
    types::provider::ProviderKeys,
    utils::{catch_panic::PanicResponder, handle_error::ErrorHandlerLayer},
};

const BUFFER_SIZE: usize = 1024;

pub type AppResponse = http::Response<
    tower_http::body::UnsyncBoxBody<
        bytes::Bytes,
        Box<
            (
                dyn std::error::Error
                    + std::marker::Send
                    + std::marker::Sync
                    + 'static
            ),
        >,
    >,
>;

pub type BoxedServiceStack =
    BoxCloneService<crate::types::request::Request, AppResponse, Infallible>;

pub type BoxedHyperServiceStack = BoxCloneService<
    http::Request<hyper::body::Incoming>,
    AppResponse,
    Infallible,
>;

#[derive(Debug, Clone)]
pub struct AppState(pub Arc<InnerAppState>);

pub struct InnerAppState {
    pub config: Config,
    pub minio: Option<Minio>,
    pub authed_rate_limit: Arc<AuthedLimiterConfig>,
    pub unauthed_rate_limit: Arc<UnauthedLimiterConfig>,
    pub store: StoreRealm,

    // the below fields should be moved to the router or org level.
    // currently its shared across all routers and that wont work for cloud
    // mode.
    pub provider_keys: ProviderKeys,
}

impl std::fmt::Debug for InnerAppState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let minio = if self.minio.is_some() {
            "Some(Minio)"
        } else {
            "None"
        };
        f.debug_struct("AppState")
            .field("config", &self.config)
            .field("authed_rate_limit", &self.authed_rate_limit)
            .field("unauthed_rate_limit", &self.unauthed_rate_limit)
            .field("store", &self.store)
            .field("minio", &minio)
            .field("provider_keys", &self.provider_keys)
            .finish()
    }
}

/// The top level app used to start the hyper server.
/// The middleware stack is as follows:
/// -- global --
/// 0. CatchPanic
/// 1. HandleError
/// 2. Authn/Authz
/// 3. Unauthenticated and authenticated rate limit layers
/// 4. MetaRouter
///
/// -- Router specific MW, must not require Clone on inner Service --
/// 5. Per User Rate Limit layer
/// 6. Per Org Rate Limit layer
/// 7. RequestContext
///    - Fetch dynamic request specific metadata
///    - Deserialize request body based on default provider
///    - Parse Helicone inputs
/// 8. Per model rate limit layer
///    - Based on request context, rate limit based on deserialized model target
///      from request context
/// 9. Request/Response cache
/// 10. Spend controls
/// 11. A/B testing between models and prompt versions
/// 12. Fallbacks
/// 13. ProviderBalancer
///
/// -- provider specific middleware --
/// 14. Per provider rate limit layer
/// 15. Mapper
///     - based on selected provider, map request body
/// 16. ProviderRegionBalancer
///
/// -- region specific middleware (none yet, just leaf service) --
/// 17. Dispatcher
///
/// Ideally we could combine the rate limits into one layer
/// instead of using tower_governor and having to split them up.
#[derive(Clone)]
pub struct App {
    pub state: AppState,
    pub service_stack: BoxedServiceStack,
}

impl tower::Service<crate::types::request::Request> for App {
    type Response = AppResponse;
    type Error = Infallible;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    #[inline]
    #[tracing::instrument(skip_all)]
    fn poll_ready(
        &mut self,
        ctx: &mut Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.service_stack.poll_ready(ctx)
    }

    #[tracing::instrument(name = "app", skip_all)]
    fn call(&mut self, req: crate::types::request::Request) -> Self::Future {
        self.service_stack.call(req)
    }
}

impl App {
    pub async fn new(
        config: Config,
    ) -> Result<(Self, ProviderMonitors), InitError> {
        tracing::info!(config = ?config, "creating app");
        let provider = StaticProvider::from_env();
        let minio = if let Some(provider) = provider {
            Some(
                Minio::builder()
                    .endpoint(config.minio.host.clone())
                    .provider(provider)
                    // we don't need TLS since this is only within the cluster
                    .secure(false)
                    .build()?,
            )
        } else {
            None
        };
        let unauthed_rate_limit =
            Arc::new(config.rate_limit.unauthed_limiter());
        let authed_rate_limit = Arc::new(config.rate_limit.authed_limiter());
        let pg_config =
            sqlx::postgres::PgPoolOptions::from(config.database.clone());
        let pg_pool = pg_config
            .connect(&config.database.url.0)
            .await
            .map_err(error::init::InitError::DatabaseConnection)?;
        let provider_keys = match &config.discover.api_keys_source {
            ProviderKeysSource::Env => ProviderKeys::from_env(),
        };
        let app_state = AppState(Arc::new(InnerAppState {
            config,
            minio,
            authed_rate_limit,
            unauthed_rate_limit,
            store: StoreRealm::new(pg_pool),
            provider_keys,
        }));

        let (router, monitors) = MetaRouter::new(app_state.clone()).await?;

        // global middleware is applied here
        let service_stack = ServiceBuilder::new()
            .layer(CatchPanicLayer::custom(PanicResponder))
            .layer(
                TraceLayer::new_for_http()
                    .make_span_with(DefaultMakeSpan::new().level(Level::INFO))
                    .on_body_chunk(())
                    .on_eos(()),
            )
            .set_x_request_id(MakeRequestId)
            .propagate_x_request_id()
            .layer(NormalizePathLayer::trim_trailing_slash())
            .layer(ErrorHandlerLayer)
            .map_err(crate::error::internal::InternalError::BufferError)
            // NOTE: not sure if there is perf impact from Auth layer coming
            // before buffer layer, but required due to Clone bound.
            .layer(AsyncRequireAuthorizationLayer::new(AuthService))
            .layer(BufferLayer::new(BUFFER_SIZE))
            .layer(ErrorHandlerLayer)
            .service(router);

        let app = Self {
            state: app_state,
            service_stack: BoxCloneService::new(service_stack),
        };

        Ok((app, monitors))
    }
}

impl meltdown::Service for App {
    type Future = BoxFuture<'static, Result<(), RuntimeError>>;

    fn run(self, token: Token) -> Self::Future {
        Box::pin(async move {
            let app_state = self.state.clone();
            let addr = SocketAddr::from((
                app_state.0.config.server.address,
                app_state.0.config.server.port,
            ));
            info!(address = %addr, tls = %app_state.0.config.server.tls, "server starting");

            let handle = axum_server::Handle::new();
            let app_factory = AppFactory::new_hyper_app(self);
            match &app_state.0.config.server.tls {
                TlsConfig::Enabled { cert, key } => {
                    let tls_config =
                        RustlsConfig::from_pem_file(cert.clone(), key.clone())
                            .await
                            .map_err(error::init::InitError::Tls)?;

                    tokio::select! {
                        biased;
                        server_output = axum_server::bind_rustls(addr, tls_config)
                            .handle(handle.clone())
                            .serve(app_factory) => server_output.map_err(RuntimeError::Serve)?,
                        _ = token => {
                            handle.graceful_shutdown(Some(std::time::Duration::from_secs(10)));
                        }
                    };
                }
                TlsConfig::Disabled => {
                    tokio::select! {
                        biased;
                        server_output = axum_server::bind(addr)
                            .handle(handle.clone())
                            .serve(app_factory) => server_output.map_err(RuntimeError::Serve)?,
                        _ = token => {
                            handle.graceful_shutdown(Some(std::time::Duration::from_secs(10)));
                        }
                    };
                }
            }
            Ok(())
        })
    }
}

#[derive(Clone)]
pub struct HyperApp {
    pub state: AppState,
    pub service_stack: BoxedHyperServiceStack,
}

impl HyperApp {
    pub fn new(app: App) -> Self {
        let service_stack = ServiceBuilder::new()
            .map_request(|req: http::Request<hyper::body::Incoming>| {
                req.map(axum_core::body::Body::new)
            })
            .service(app.service_stack);
        Self {
            state: app.state,
            service_stack: BoxCloneService::new(service_stack),
        }
    }
}

impl tower::Service<http::Request<hyper::body::Incoming>> for HyperApp {
    type Response = AppResponse;
    type Error = Infallible;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    #[inline]
    fn poll_ready(
        &mut self,
        ctx: &mut Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.service_stack.poll_ready(ctx)
    }

    fn call(
        &mut self,
        req: http::Request<hyper::body::Incoming>,
    ) -> Self::Future {
        self.service_stack.call(req)
    }
}

#[derive(Clone)]
pub struct AppFactory<S> {
    pub state: AppState,
    pub inner: S,
}

impl<S> AppFactory<S> {
    pub fn new(state: AppState, inner: S) -> Self {
        Self { state, inner }
    }
}

impl AppFactory<HyperApp> {
    pub fn new_hyper_app(app: App) -> Self {
        Self {
            state: app.state.clone(),
            inner: HyperApp::new(app),
        }
    }
}

impl<S> tower::Service<SocketAddr> for AppFactory<S>
where
    S: Clone,
{
    type Response = AddExtension<S, SocketAddr>;
    type Error = Infallible;
    type Future = Ready<Result<Self::Response, Self::Error>>;

    #[inline]
    fn poll_ready(
        &mut self,
        _ctx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    fn call(&mut self, socket: SocketAddr) -> Self::Future {
        // see: https://docs.rs/tower/latest/tower/trait.Service.html#be-careful-when-cloning-inner-services
        let mut inner = self.inner.clone();
        std::mem::swap(&mut self.inner, &mut inner);
        let svc = ServiceBuilder::new()
            .layer(tower_http::add_extension::AddExtensionLayer::new(socket))
            .service(inner);
        ready(Ok(svc))
    }
}
