use std::path::PathBuf;

use clap::Parser;
use llm_proxy::{
    app::App,
    config::Config,
    control_plane::websocket::ControlPlaneClient,
    discover::monitor::health::provider::HealthMonitor,
    error::{init::InitError, runtime::RuntimeError},
    metrics::system::SystemMetrics,
    middleware::rate_limit,
    utils::meltdown::TaggedService,
};
use meltdown::Meltdown;
use tracing::info;

#[global_allocator]
static GLOBAL: jemallocator::Jemalloc = jemallocator::Jemalloc;

#[derive(Debug, Parser)]
pub struct Args {
    /// Path to the default config file.
    /// Configs in this file can be overridden by environment variables.
    #[arg(short, long)]
    config: Option<PathBuf>,
}

#[tokio::main]
async fn main() -> Result<(), RuntimeError> {
    dotenvy::dotenv().ok();
    let args = Args::parse();
    let config = match Config::try_read(args.config) {
        Ok(config) => config,
        Err(error) => {
            eprintln!("failed to read config: {error}");
            std::process::exit(1);
        }
    };
    // Initialize telemetry
    let (logger_provider, tracer_provider, metrics_provider) =
        telemetry::init_telemetry(&config.telemetry)
            .map_err(InitError::Telemetry)
            .map_err(RuntimeError::Init)?;
    let ws_url = &config.helicone.websocket_url.to_string();

    info!("telemetry initialized");
    let mut shutting_down = false;
    let app = App::new(config).await?;
    let health_monitor = HealthMonitor::new(app.state.clone());

    let rate_limiting_cleanup_service =
        rate_limit::cleanup::GarbageCollector::new(
            app.state.clone(),
            app.state.0.config.rate_limit.cleanup_interval(),
        );

    let mut meltdown = Meltdown::new()
        .register(TaggedService::new(
            "shutdown-signals",
            llm_proxy::utils::meltdown::wait_for_shutdown_signals,
        ))
        .register(TaggedService::new("proxy", app))
        .register(TaggedService::new(
            "provider-health-monitor",
            health_monitor,
        ))
        .register(TaggedService::new("system-metrics", SystemMetrics))
        .register(TaggedService::new(
            "rate-limiting-cleanup",
            rate_limiting_cleanup_service,
        ))
        .register(TaggedService::new(
            "control-plane-client",
            ControlPlaneClient::connect(ws_url).await?,
        ));

    while let Some((service, result)) = meltdown.next().await {
        match result {
            Ok(()) => info!(%service, "service stopped"),
            Err(error) => tracing::error!(%service, %error, "service crashed"),
        }

        if !shutting_down {
            info!("shutting down");
            meltdown.trigger();
            shutting_down = true;
        }
    }

    if let Some(logger_provider) = logger_provider {
        if let Err(e) = logger_provider.shutdown() {
            println!("error shutting down logger provider: {e}");
        }
    }
    if let Err(e) = tracer_provider.shutdown() {
        println!("error shutting down tracer provider: {e}");
    }
    if let Some(metrics_provider) = metrics_provider {
        if let Err(e) = metrics_provider.shutdown() {
            println!("error shutting down metrics provider: {e}");
        }
    }

    info!("shut down");

    Ok(())
}
