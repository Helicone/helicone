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
use tokio::sync::Mutex;
use tower::{
    BoxError, ServiceBuilder, buffer::BufferLayer, util::BoxCloneService,
};
use tower_http::{
    add_extension::AddExtension, auth::AsyncRequireAuthorizationLayer,
};
use tracing::info;

use crate::{
    config::{
        Config,
        rate_limit::{AuthedLimiterConfig, UnauthedLimiterConfig},
        server::TlsConfig,
    },
    discover::ProviderChangeBroadcasts,
    error,
    middleware::auth::AuthService,
    router::model::ModelRouter,
    store::StoreRealm,
};

const MAX_QUEUED_REQUESTS: usize = 1024;

pub type ServiceStack = BoxCloneService<
    crate::types::request::Request,
    crate::types::response::Response,
    BoxError,
>;

pub type HyperServiceStack = BoxCloneService<
    http::Request<hyper::body::Incoming>,
    crate::types::response::Response,
    BoxError,
>;

#[derive(Debug, Clone)]
pub struct AppState(pub Arc<InnerAppState>);

pub struct InnerAppState {
    pub config: Config,
    pub minio: Option<Minio>,
    pub authed_rate_limit: Arc<AuthedLimiterConfig>,
    pub unauthed_rate_limit: Arc<UnauthedLimiterConfig>,
    pub store: StoreRealm,
    pub broadcasts: Mutex<ProviderChangeBroadcasts>,
}

impl std::fmt::Debug for InnerAppState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let minio = if let Some(_) = &self.minio {
            "Some(Minio)"
        } else {
            "None"
        };
        f.debug_struct("AppState")
            .field("config", &self.config)
            .field("authed_rate_limit", &self.authed_rate_limit)
            .field("unauthed_rate_limit", &self.unauthed_rate_limit)
            .field("store", &self.store)
            .field("broadcasts", &self.broadcasts)
            .field("minio", &minio)
            .finish()
    }
}

/// The top level app used to start the hyper server.
/// The middleware stack is as follows:
/// -- global middleware --
/// 0. Buffer
/// 1. CatchPanic
/// 2. Authn/Authz
/// 3. Per User Rate Limit layer
/// 4. Per Org Rate Limit layer
/// 5. RequestContext
/// -- model specific middleware --
/// 6. Per model rate limit layer
/// 7. ModelRouter
/// -- provider specific middleware --
/// 8. Per provider rate limit layer
/// 9. ProviderBalancer
/// --- model/provider specific middleware --
/// --- none in use yet --
/// 10. DispatcherServiceStack
/// 11. Dispatcher
#[derive(Clone)]
pub struct App {
    pub state: AppState,
    pub service_stack: ServiceStack,
}

impl tower::Service<crate::types::request::Request> for App {
    type Response = crate::types::response::Response;
    type Error = BoxError;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(
        &mut self,
        ctx: &mut Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.service_stack.poll_ready(ctx)
    }

    fn call(&mut self, req: crate::types::request::Request) -> Self::Future {
        self.service_stack.call(req)
    }
}

impl App {
    pub async fn new(config: Config) -> Result<Self, error::init::Error> {
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
            .map_err(error::init::Error::DatabaseConnection)?;
        let broadcasts = ProviderChangeBroadcasts::new(&config);

        let app_state = AppState(Arc::new(InnerAppState {
            config,
            minio,
            authed_rate_limit,
            unauthed_rate_limit,
            store: StoreRealm::new(pg_pool),
            broadcasts: Mutex::new(broadcasts),
        }));

        let router = ModelRouter::new(app_state.clone());

        // global middleware is applied here
        let service_stack = ServiceBuilder::new()
            .layer(BufferLayer::new(8))
            // .layer(CatchPanicLayer::new())
            .layer(AsyncRequireAuthorizationLayer::new(AuthService))
            .layer(
                crate::middleware::request_context::Layer::<reqwest::Body>::new(
                    app_state.clone(),
                ),
            )
            // other middleware: rate limiting, logging, etc, etc
            // will be added here as well
            .map_err(|e| crate::error::api::Error::Box(e))
            .layer(BufferLayer::new(MAX_QUEUED_REQUESTS))
            .service(router);

        Ok(Self {
            state: app_state,
            service_stack: BoxCloneService::new(service_stack),
        })
    }
}

impl meltdown::Service for App {
    type Future = BoxFuture<'static, Result<(), crate::error::runtime::Error>>;

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
                            .map_err(error::init::Error::Tls)?;

                    tokio::select! {
                        biased;
                        server_output = axum_server::bind_rustls(addr, tls_config)
                            .handle(handle.clone())
                            .serve(app_factory) => server_output.map_err(error::runtime::Error::Serve)?,
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
                            .serve(app_factory) => server_output.map_err(error::runtime::Error::Serve)?,
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
    pub service_stack: HyperServiceStack,
}

impl HyperApp {
    pub fn new(app: App) -> Self {
        let service_stack = ServiceBuilder::new()
            .map_request(|req: http::Request<hyper::body::Incoming>| {
                req.map(reqwest::Body::wrap)
            })
            .service(app.service_stack);
        Self {
            state: app.state,
            service_stack: BoxCloneService::new(service_stack),
        }
    }
}

impl tower::Service<http::Request<hyper::body::Incoming>> for HyperApp {
    type Response = crate::types::response::Response;
    type Error = BoxError;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

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

    fn poll_ready(
        &mut self,
        _ctx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    fn call(&mut self, socket: SocketAddr) -> Self::Future {
        let svc = ServiceBuilder::new()
            .layer(tower_http::add_extension::AddExtensionLayer::new(socket))
            .service(self.inner.clone());
        ready(Ok(svc))
    }
}
