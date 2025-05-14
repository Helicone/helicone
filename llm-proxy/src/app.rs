use std::{
    convert::Infallible,
    future::{Ready, ready},
    net::SocketAddr,
    sync::Arc,
    task::{Context, Poll},
    time::Duration,
};

use axum_server::{accept::NoDelayAcceptor, tls_rustls::RustlsConfig};
use futures::future::BoxFuture;
use meltdown::Token;
use opentelemetry::{global, trace::TraceContextExt};
use reqwest::Client;
use telemetry::{make_span::SpanFactory, tracing::MakeRequestId};
use tower::{ServiceBuilder, buffer::BufferLayer, util::BoxCloneService};
use tower_http::{
    ServiceBuilderExt, add_extension::AddExtension,
    auth::AsyncRequireAuthorizationLayer, catch_panic::CatchPanicLayer,
    normalize_path::NormalizePathLayer, trace::TraceLayer,
};
use tracing::{Level, Span, info};
use tracing_opentelemetry::OpenTelemetrySpanExt;

use crate::{
    config::{Config, minio::Minio, server::TlsConfig},
    discover::provider::monitor::ProviderMonitors,
    error::{self, init::InitError, runtime::RuntimeError},
    metrics::{self, Metrics},
    middleware::auth::AuthService,
    router::meta::MetaRouter,
    store::StoreRealm,
    utils::{catch_panic::PanicResponder, handle_error::ErrorHandlerLayer},
};

const BUFFER_SIZE: usize = 1024;
const JAWN_CONNECT_TIMEOUT: Duration = Duration::from_secs(10);

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

#[derive(Debug)]
pub struct InnerAppState {
    pub config: Config,
    pub minio: Minio,
    pub jawn_client: Client,
    pub store: StoreRealm,
    pub metrics: Metrics,
}

/// The top level app used to start the hyper server.
/// The middleware stack is as follows:
/// -- global --
/// 0. `CatchPanic`
/// 1. `HandleError`
/// 2. Authn/Authz
/// 3. Unauthenticated and authenticated rate limit layers
/// 4. `MetaRouter`
///
/// -- Router specific MW, must not require Clone on inner Service --
/// 5. Per User Rate Limit layer
/// 6. Per Org Rate Limit layer
/// 7. `RequestContext`
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
/// 13. `ProviderBalancer`
///
/// -- provider specific middleware --
/// 14. Per provider rate limit layer
/// 15. Mapper
///     - based on selected provider, map request body
/// 16. `ProviderRegionBalancer`
///
/// -- region specific middleware (none yet, just leaf service) --
/// 17. Dispatcher
///
/// Ideally we could combine the rate limits into one layer
/// instead of using `tower_governor` and having to split them up.
///
///
/// For request processing, we need to use some dynamically added
/// request extensions. We try to aggregate most of this into the
/// `RequestContext` struct to keep things simple but for some things
/// we will use separate types to avoid needing to use `Option`s in
/// the `RequestContext` struct.
///
/// Required request extensions:
/// - `AuthContext`
///    - Added by the auth layer
///    - Removed by the request context layer and aggregated into the
///      `Arc<RequestContext>`
/// - `Arc<RequestContext>`
///   - Added by the request context layer
///   - Used by many layers
/// - `Provider`
///   - Added by the `AddExtensionLayer` in the dispatcher service stack
///   - Used by the Mapper layer
/// - `PathAndQuery`
///   - Added by the `MetaRouter`
///   - Used by the Mapper layer
/// - `RouterConfig`
///   - Added by the `MetaRouter`
///   - Used by the Mapper layer
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

    #[inline]
    #[tracing::instrument(name = "app", skip_all)]
    fn call(&mut self, req: crate::types::request::Request) -> Self::Future {
        let trace_id =
            Span::current().context().span().span_context().trace_id();
        tracing::trace!(uri = %req.uri(), method = %req.method(), version = ?req.version(), trace_id = %trace_id, "App received request");
        self.service_stack.call(req)
    }
}

impl App {
    pub async fn new(
        config: Config,
    ) -> Result<(Self, ProviderMonitors), InitError> {
        tracing::info!(config = ?config, "creating app");
        let minio = Minio::new(config.minio.clone())?;
        let pg_config =
            sqlx::postgres::PgPoolOptions::from(config.database.clone());
        let pg_pool = pg_config
            .connect_lazy(&config.database.url.0)
            .map_err(error::init::InitError::DatabaseConnection)?;
        let jawn_client = Client::builder()
            .tcp_nodelay(true)
            .connect_timeout(JAWN_CONNECT_TIMEOUT)
            .build()
            .map_err(error::init::InitError::CreateReqwestClient)?;

        // If global meter is not set, opentelemetry defaults to a
        // NoopMeterProvider
        let meter = global::meter("helicone-router");
        let metrics = metrics::Metrics::new(&meter);

        let app_state = AppState(Arc::new(InnerAppState {
            config,
            minio,
            store: StoreRealm::new(pg_pool),
            jawn_client,
            metrics,
        }));

        let (router, monitors) = MetaRouter::new(app_state.clone()).await?;

        // global middleware is applied here
        let service_stack = ServiceBuilder::new()
            .layer(CatchPanicLayer::custom(PanicResponder))
            .layer(
                TraceLayer::new_for_http()
                    .make_span_with(SpanFactory::new().level(Level::INFO))
                    .on_body_chunk(())
                    .on_eos(()),
            )
            .set_x_request_id(MakeRequestId)
            .propagate_x_request_id()
            .layer(NormalizePathLayer::trim_trailing_slash())
            .layer(ErrorHandlerLayer::new(app_state.clone()))
            // NOTE: not sure if there is perf impact from Auth layer coming
            // before buffer layer, but required due to Clone bound.
            .layer(AsyncRequireAuthorizationLayer::new(AuthService))
            .map_err(crate::error::internal::InternalError::BufferError)
            .layer(BufferLayer::new(BUFFER_SIZE))
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
                            // https://brooker.co.za/blog/2024/05/09/nagle.html
                            .acceptor(NoDelayAcceptor)
                            .handle(handle.clone())
                            .serve(app_factory) => server_output.map_err(RuntimeError::Serve)?,
                        () = token => {
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
                        () = token => {
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
    #[must_use]
    pub fn new(app: App) -> Self {
        let state = app.state.clone();
        let service_stack = ServiceBuilder::new()
            .map_request(|req: http::Request<hyper::body::Incoming>| {
                req.map(axum_core::body::Body::new)
            })
            .service(app);
        Self {
            state,
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

    #[inline]
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
    #[must_use]
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
