use std::{sync::Arc, time::Duration};

use futures::future::BoxFuture;
use http::Request;
use meltdown::Token;
use minio_rsc::{Minio, provider::StaticProvider};
use tokio::{io, net::TcpListener};
use tower::{
    Service, ServiceBuilder,
    util::{BoxCloneService, BoxService},
};
use tower_http::{
    auth::{AsyncRequireAuthorization, AsyncRequireAuthorizationLayer},
    catch_panic::{CatchPanic, CatchPanicLayer, DefaultResponseForPanic},
};
use tracing::info;

use crate::{
    config::{
        Config,
        rate_limit::{AuthedLimiterConfig, UnauthedLimiterConfig},
    },
    error,
    middleware::{
        auth::AuthService, request_context::Service as RequestContextService,
    },
    registry::Registry,
    router::Router,
    store::StoreRealm,
};

/// Type representing the middleware layers.
///
/// When adding a new middleware, you'll be required to add it to this type.
pub type ServiceStack = CatchPanic<
    AsyncRequireAuthorization<
        RequestContextService<Router, reqwest::Body>,
        AuthService,
    >,
    DefaultResponseForPanic,
>;

#[derive(Debug, Clone)]
pub struct AppState(pub Arc<InnerAppState>);

pub struct InnerAppState {
    pub config: Config,
    pub minio: Option<Minio>,
    pub authed_rate_limit: Arc<AuthedLimiterConfig>,
    pub unauthed_rate_limit: Arc<UnauthedLimiterConfig>,
    pub store: StoreRealm,
}

impl std::fmt::Debug for InnerAppState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AppState")
            .field("config", &self.config)
            .field("authed_rate_limit", &self.authed_rate_limit)
            .field("unauthed_rate_limit", &self.unauthed_rate_limit)
            .field("store", &self.store)
            .finish()
    }
}

pub(crate) struct InnerApp<ReqBody> {
    pub state: AppState,
    pub service_stack: BoxCloneService<
        http::Request<ReqBody>,
        http::Response<reqwest::Body>,
        crate::error::api::Error,
    >,
}

impl<ReqBody> tower::Service<http::Request<ReqBody>> for InnerApp<ReqBody> {
    type Response = http::Response<reqwest::Body>;
    type Error = crate::error::api::Error;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(
        &mut self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.service_stack.poll_ready(cx)
    }

    fn call(&mut self, req: http::Request<ReqBody>) -> Self::Future {
        self.service_stack.call(req)
    }
}

pub struct App {
    pub(crate) inner: InnerApp<hyper::body::Incoming>,
}

impl App {
    pub async fn new(config: Config) -> Result<Self, error::init::Error> {
        let inner = InnerApp::new(config).await?;
        Ok(Self { inner })
    }

    pub fn state(&self) -> &AppState {
        &self.inner.state
    }
}

impl meltdown::Service for App {
    type Future = BoxFuture<'static, Result<(), crate::error::runtime::Error>>;

    fn run(self, token: Token) -> Self::Future {
        self.inner.run(token)
    }
}

/// Usable in the test [`Harness`](crate::tests::harness::Harness) so that we
/// can use a high level API to write unit tests against the entire app stack.
pub struct TestApp {
    pub(crate) inner: InnerApp<reqwest::Body>,
}

impl TestApp {
    pub async fn new(config: Config) -> Result<Self, error::init::Error> {
        let inner = InnerApp::new(config).await?;
        Ok(Self { inner })
    }
}

/*

reqs -> ProviderRouter -> ModelRouter

--> Provider Discover
--> Model Discover for the provider

*/

impl<ReqBody> InnerApp<ReqBody>
where
    ReqBody: hyper::body::Body + Send + Sync + 'static,
    ReqBody::Error: Into<Box<dyn std::error::Error + Send + Sync>>,
    bytes::Bytes: From<<ReqBody as hyper::body::Body>::Data>,
{
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

        let registry = Registry::new(&config.dispatcher);
        let router = Router::new(registry);

        let app_state = AppState(Arc::new(InnerAppState {
            config,
            minio,
            authed_rate_limit,
            unauthed_rate_limit,
            store: StoreRealm::new(pg_pool),
        }));

        let service_stack = ServiceBuilder::new()
            .layer(CatchPanicLayer::new())
            .map_request(|r: http::Request<ReqBody>| {
                let (parts, body) = r.into_parts();
                let body = reqwest::Body::wrap(body);
                Request::from_parts(parts, body)
            })
            .layer(AsyncRequireAuthorizationLayer::new(AuthService))
            .layer(crate::middleware::request_context::Layer::<ReqBody>::new(
                app_state.clone(),
            ))
            // other middleware: rate limiting, logging, etc, etc
            // will be added here as well
            .service(router);

        todo!()
        // Ok(Self {
        //     state: app_state,
        //     service_stack: todo!(),
        // })
    }
}

impl meltdown::Service for InnerApp<hyper::body::Incoming> {
    type Future = BoxFuture<'static, Result<(), crate::error::runtime::Error>>;

    fn run(self, mut token: Token) -> Self::Future {
        Box::pin(async move {
            let service_stack = hyper_util::service::TowerToHyperService::new(
                self.service_stack,
            );

            info!(address = %self.state.0.config.server.address, tls = %self.state.0.config.server.tls, "server starting");
            let listener = TcpListener::bind((
                self.state.0.config.server.address,
                self.state.0.config.server.port,
            ))
            .await
            .map_err(crate::error::init::Error::Bind)?;
            let server = hyper_util::server::conn::auto::Builder::new(
                hyper_util::rt::TokioExecutor::new(),
            );
            let graceful =
                hyper_util::server::graceful::GracefulShutdown::new();
            tracing::info!("server started");

            loop {
                tokio::select! {
                    conn = listener.accept() => {
                        let (stream, peer_addr) = match conn {
                            Ok(conn) => conn,
                            Err(e) => {
                                handle_accept_error(e).await;
                                continue;
                            }
                        };
                        tracing::info!(peer_addr = %peer_addr, "accepted new connection");
                        let stream = hyper_util::rt::TokioIo::new(Box::pin(stream));
                        let conn = server.serve_connection_with_upgrades(stream, service_stack.clone());

                        let conn = graceful.watch(conn.into_owned());

                        tokio::spawn(async move {
                            if let Err(err) = conn.await {
                                tracing::error!(error = ?err, "connection error");
                            }
                            tracing::trace!(peer_addr = %peer_addr, "connection completed");
                        });
                    },

                    _ = &mut token => {
                        drop(listener);
                        tracing::info!("Shutdown signal received, starting shutdown");
                            break;
                    }
                }
            }

            // timeout for graceful shutdown
            tokio::select! {
                _ = graceful.shutdown() => {
                    tracing::info!("Gracefully shutdown successfully!");
                },
                _ = tokio::time::sleep(self.state.0.config.server.shutdown_timeout) => {
                    tracing::info!("Reached graceful shutdown timeout {:?}, aborting...", self.state.0.config.server.shutdown_timeout);
                }
            }

            Ok(())
        })
    }
}

async fn handle_accept_error(e: io::Error) {
    if is_connection_error(&e) {
        return;
    }

    // [From `hyper::Server` in 0.14](https://github.com/hyperium/hyper/blob/v0.14.27/src/server/tcp.rs#L186)
    //
    // > A possible scenario is that the process has hit the max open files
    // > allowed, and so trying to accept a new connection will fail with
    // > `EMFILE`. In some cases, it's preferable to just wait for some time, if
    // > the application will likely close some files (or connections), and try
    // > to accept the connection again. If this option is `true`, the error
    // > will be logged at the `error` level, since it is still a big deal,
    // > and then the listener will sleep for 1 second.
    //
    // hyper allowed customizing this but axum does not.
    tracing::error!(error = ?e, "error accepting connection");
    tokio::time::sleep(Duration::from_millis(500)).await;
}

fn is_connection_error(e: &io::Error) -> bool {
    matches!(
        e.kind(),
        io::ErrorKind::ConnectionRefused
            | io::ErrorKind::ConnectionAborted
            | io::ErrorKind::ConnectionReset
    )
}
