use std::sync::Arc;

use deadpool_postgres::Pool;
use futures::future::BoxFuture;
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
    middleware::request_context::Service as RequestContextService,
    error,
    registry::Registry,
    router::Router,
};

/// Type representing the middleware layers.
/// 
/// When adding a new middleware, you'll be required to add it to this type.
pub type ServiceStack = RequestContextService<Router>;

pub struct App {
    pub config: Config,
    pub minio: Option<Minio>,
    pub authed_rate_limit: Arc<AuthedLimiterConfig>,
    pub unauthed_rate_limit: Arc<UnauthedLimiterConfig>,
    pub pg_pool: Pool,
    pub service_stack: ServiceStack,
}

impl App {
    pub fn new(config: Config) -> Result<Self, error::init::Error> {
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
            deadpool_postgres::Config::from(config.database.clone());
        let pg_pool = pg_config.create_pool(
            Some(deadpool_postgres::Runtime::Tokio1),
            tokio_postgres::NoTls,
        )?;


        let registry = Registry::new(&config.dispatcher);
        let router = Router::new(registry);
        let service_stack: ServiceStack = ServiceBuilder::new()
            .layer(crate::middleware::request_context::Layer::new(
                pg_pool.clone(),
            ))
            // other middleware: rate limiting, logging, etc, etc
            // will be added here as well
            .service(router);

        Ok(Self {
            config,
            minio,
            authed_rate_limit,
            unauthed_rate_limit,
            pg_pool,
            service_stack,
        })
    }
}

impl meltdown::Service for App {
    type Future = BoxFuture<'static, Result<(), crate::error::runtime::Error>>;

    fn run(self, mut token: Token) -> Self::Future {
        Box::pin(async move {
            let service_stack =
                hyper_util::service::TowerToHyperService::new(self.service_stack);

            info!(address = %self.config.server.address, tls = %self.config.server.tls, "server starting");
            let listener = TcpListener::bind((
                self.config.server.address,
                self.config.server.port,
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
                _ = tokio::time::sleep(self.config.server.shutdown_timeout) => {
                    tracing::info!("Reached graceful shutdown timeout {:?}, aborting...", self.config.server.shutdown_timeout);
                }
            }

            Ok(())
        })
    }
}
