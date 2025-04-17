use std::sync::Arc;

use futures::future::BoxFuture;
use hyper::body::Body;
use meltdown::Token;
use minio_rsc::{Minio, provider::StaticProvider};
use tokio::net::TcpListener;
use tower::ServiceBuilder;
use tracing::info;

use crate::{
    config::{
        Config,
        rate_limit::{AuthedLimiterConfig, UnauthedLimiterConfig},
    },
    error,
    middleware::request_context::Service as RequestContextService,
    registry::Registry,
    router::Router,
    store::StoreRealm,
};

/// Type representing the middleware layers.
///
/// When adding a new middleware, you'll be required to add it to this type.
pub type ServiceStack<ReqBody> =
    RequestContextService<Router<ReqBody>, ReqBody>;

pub struct AppContext {
    pub config: Config,
    pub minio: Option<Minio>,
    pub authed_rate_limit: Arc<AuthedLimiterConfig>,
    pub unauthed_rate_limit: Arc<UnauthedLimiterConfig>,
    pub store: StoreRealm,
}

impl std::fmt::Debug for AppContext {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AppContext")
            .field("config", &self.config)
            .field("authed_rate_limit", &self.authed_rate_limit)
            .field("unauthed_rate_limit", &self.unauthed_rate_limit)
            .field("store", &"StoreRealm") // Using a string representation since StoreRealm might not
            // implement Debug
            .finish()
    }
}

pub struct App<ReqBody> {
    pub context: Arc<AppContext>,
    pub service_stack: ServiceStack<ReqBody>,
}

impl<ReqBody> App<ReqBody>
where
    ReqBody: Body + Send + Sync + 'static,
    <ReqBody as hyper::body::Body>::Error: Send + Sync + std::error::Error,
    <ReqBody as hyper::body::Body>::Data: Send + Sync,
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

        let app_ctx = Arc::new(AppContext {
            config,
            minio,
            authed_rate_limit,
            unauthed_rate_limit,
            store: StoreRealm::new(pg_pool),
        });

        let service_stack: ServiceStack<ReqBody> = ServiceBuilder::new()
            .layer(crate::middleware::request_context::Layer::new(
                app_ctx.clone(),
            ))
            // other middleware: rate limiting, logging, etc, etc
            // will be added here as well
            .service(router);

        Ok(Self {
            context: app_ctx,
            service_stack,
        })
    }
}

impl meltdown::Service for App<hyper::body::Incoming> {
    type Future = BoxFuture<'static, Result<(), crate::error::runtime::Error>>;

    fn run(self, mut token: Token) -> Self::Future {
        Box::pin(async move {
            let service_stack = hyper_util::service::TowerToHyperService::new(
                self.service_stack,
            );

            info!(address = %self.context.config.server.address, tls = %self.context.config.server.tls, "server starting");
            let listener = TcpListener::bind((
                self.context.config.server.address,
                self.context.config.server.port,
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
                                tracing::error!("accept error: {}", e);
                                continue;
                            }
                        };
                        let stream = hyper_util::rt::TokioIo::new(Box::pin(stream));
                        let conn = server.serve_connection_with_upgrades(stream, service_stack.clone());

                        let conn = graceful.watch(conn.into_owned());

                        tokio::spawn(async move {
                            if let Err(err) = conn.await {
                                tracing::error!("connection error: {}", err);
                            }
                            tracing::info!("connection dropped: {}", peer_addr);
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
                _ = tokio::time::sleep(self.context.config.server.shutdown_timeout) => {
                    tracing::info!("Reached graceful shutdown timeout {:?}, aborting...", self.context.config.server.shutdown_timeout);
                }
            }

            Ok(())
        })
    }
}
