use std::path::PathBuf;

use clap::Parser;
use llm_proxy::{
    app::App, config::Config, middleware, utils::meltdown::TaggedService,
};
use meltdown::Meltdown;
use tracing::info;

#[derive(Debug, Parser)]
pub struct Args {
    /// Path to the default config file.
    /// Configs in this file can be overridden by environment variables.
    #[arg(short, long)]
    config: Option<PathBuf>,
}

#[tokio::main]
async fn main() -> Result<(), llm_proxy::error::runtime::Error> {
    let args = Args::parse();
    let config = match Config::try_read(args.config) {
        Ok(config) => config,
        Err(error) => {
            eprintln!("failed to read config: {}", error);
            std::process::exit(1);
        }
    };
    // Initialize telemetry
    let _logger_provider: opentelemetry_sdk::logs::LoggerProvider =
        telemetry::init_telemetry(&config.telemetry)
            .map_err(llm_proxy::error::init::Error::Telemetry)
            .map_err(llm_proxy::error::runtime::Error::Init)?;

    info!("telemetry initialized");
    info!(config = ?config.clone(), "config loaded");

    let mut shutting_down = false;
    let app = App::new(config.clone())?;

    let rate_limiting_cleanup_service =
        middleware::rate_limit::service::Service::new(
            app.authed_rate_limit.clone(),
            app.unauthed_rate_limit.clone(),
            config.rate_limit.cleanup_interval,
        );

    let mut meltdown = Meltdown::new()
        .register(TaggedService::new(
            "shutdown-signals",
            llm_proxy::utils::meltdown::wait_for_shutdown_signals,
        ))
        .register(TaggedService::new("proxy", app))
        // .register(TaggedService::new("proxy-metrics", metrics_server))
        .register(TaggedService::new(
            "rate-limit-cleanup",
            rate_limiting_cleanup_service,
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

    // TODO: why does this hang?
    // logger_provider
    //     .shutdown()
    //     .map_err(TelemetryError::Logs)
    //     .map_err(llm_proxy::error::runtime::Error::Telemetry)?;
    opentelemetry::global::shutdown_tracer_provider();

    info!("shut down");

    Ok(())
}
