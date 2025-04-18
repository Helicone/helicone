//! A MITM proxy for intercepting and routing LLM API requests.
//!
//! This proxy intercepts HTTP and HTTPS traffic, allowing for inspection and
//! modification of requests and responses between clients and LLM API
//! providers.

use std::time::Duration;

use rama::{
    Layer,
    error::ErrorContext,
    http::server::HttpServer,
    net::stream::layer::http::BodyLimitLayer,
    rt::Executor,
    tcp::server::TcpListener,
};
use rama_helicone_router::{
    app::{App, AppState, Context},
    config::Config,
    error::init::InitError,
};
use tracing::level_filters::LevelFilter;
use tracing_subscriber::{
    EnvFilter, fmt, layer::SubscriberExt, util::SubscriberInitExt,
};

#[tokio::main]
async fn main() -> Result<(), rama_helicone_router::error::runtime::Error> {
    tracing_subscriber::registry()
        .with(fmt::layer())
        .with(
            EnvFilter::builder()
                .with_default_directive(LevelFilter::INFO.into())
                .from_env_lossy(),
        )
        .init();

    let state = AppState::new(Config::default())?;
    let graceful = rama::graceful::Shutdown::default();
    let tcp_service = TcpListener::build_with_state(state.clone())
        .bind((state.0.config.server.address, state.0.config.server.port))
        .await
        .map_err(InitError::Bind)?;

    let ctx = Context::with_state(state.clone());
    let app = App::new(ctx);

    graceful.spawn_task_fn(async |guard| {
        let exec = Executor::graceful(guard.clone());
        let http_service = HttpServer::auto(exec).service(app);

        tcp_service
            .serve_graceful(
                guard,
                (
                    // protect the http proxy from too large bodies, both from
                    // request and response end
                    BodyLimitLayer::symmetric(2 * 1024 * 1024),
                )
                    .into_layer(http_service),
            )
            .await;
    });

    graceful
        .shutdown_with_limit(Duration::from_secs(30))
        .await
        .context("graceful shutdown")
        .map_err(rama_helicone_router::error::runtime::Error::Shutdown)?;

    Ok(())
}
