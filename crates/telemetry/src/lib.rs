pub mod logging;
pub mod tracing;

use opentelemetry::{KeyValue, trace::TracerProvider};
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::{Resource, logs::LoggerProvider};
use serde::{Deserialize, Serialize};
pub use tracing_subscriber::util::TryInitError;
use tracing_subscriber::{
    EnvFilter, Layer,
    filter::{Directive, ParseError},
    layer::SubscriberExt,
    util::SubscriberInitExt,
};

pub use self::{
    logging::{Config as LoggingConfig, Format as LoggingFormat},
    tracing::Config as TracingConfig,
};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(default, deny_unknown_fields, rename_all = "kebab-case")]
pub struct Config {
    #[serde(default)]
    pub logging: LoggingConfig,
    #[serde(default)]
    pub tracing: TracingConfig,
    #[serde(default = "default_service_name")]
    pub service_name: String,
    #[serde(default = "default_otlp_exporter_endpoint")]
    pub otlp_exporter_endpoint: String,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            logging: LoggingConfig::default(),
            tracing: TracingConfig::default(),
            service_name: default_service_name().to_string(),
            otlp_exporter_endpoint: default_otlp_exporter_endpoint()
                .to_string(),
        }
    }
}

fn default_service_name() -> String {
    "helicone-router".to_string()
}

fn default_otlp_exporter_endpoint() -> String {
    "http://localhost:4317".to_string()
}

#[derive(Debug, thiserror::Error)]
pub enum TelemetryError {
    #[error("Tracing error: {0}")]
    Tracing(#[from] opentelemetry::trace::TraceError),
    #[error("Metrics error: {0}")]
    Metrics(#[from] opentelemetry::metrics::MetricsError),
    #[error("Logs error: {0}")]
    Logs(#[from] opentelemetry::logs::LogError),
    #[error("Invalid log directive: {0}")]
    InvalidLogDirective(#[from] ParseError),
    #[error("Subscriber error: {0}")]
    Subscriber(#[from] TryInitError),
    #[error("Otel http metrics error")]
    OtelHttpMetrics,
}

pub fn init_telemetry(
    config: &Config,
) -> Result<LoggerProvider, TelemetryError> {
    let resource = Resource::new(vec![KeyValue::new(
        opentelemetry_semantic_conventions::resource::SERVICE_NAME,
        config.service_name.clone(),
    )]);

    // logs
    let logger_provider = init_logs(config, resource.clone())?;
    let logger_layer =
        opentelemetry_appender_tracing::layer::OpenTelemetryTracingBridge::new(
            &logger_provider,
        );

    let fmt_layer = tracing_subscriber::fmt::layer()
        .pretty()
        .with_file(true)
        .with_line_number(true);

    let registry = tracing_subscriber::registry()
        .with(env_filter(config)?)
        .with(fmt_layer)
        .with(logger_layer);

    // tracing
    if config.tracing.enabled {
        let tracer_provider = init_tracer_provider(config, resource.clone())?;
        opentelemetry::global::set_tracer_provider(tracer_provider.clone());
        let tracer = tracer_provider.tracer(config.service_name.clone());
        let tracing_layer = tracing_opentelemetry::layer()
            .with_tracer(tracer)
            .with_filter(env_filter(config)?);
        registry.with(tracing_layer).try_init()?;
    } else {
        registry.try_init()?;
    }

    log_panics::init();

    opentelemetry::global::set_error_handler(
        |error| ::tracing::error!(%error, "opentelemetry error"),
    )
    .expect("can always set the error handler");

    Ok(logger_provider)
}

// it doesn't impl clone so we need to return a new one each time
fn env_filter(config: &Config) -> Result<EnvFilter, TelemetryError> {
    let directive: Directive = config.logging.level.parse()?;
    let filter = EnvFilter::builder()
        .with_default_directive(directive)
        .parse("")?;
    Ok(filter)
}

fn init_logs(
    config: &Config,
    resource: Resource,
) -> Result<opentelemetry_sdk::logs::LoggerProvider, TelemetryError> {
    opentelemetry_otlp::new_pipeline()
        .logging()
        .with_resource(resource)
        .with_exporter(
            opentelemetry_otlp::new_exporter()
                .tonic()
                .with_endpoint(config.otlp_exporter_endpoint.clone()),
        )
        .install_batch(opentelemetry_sdk::runtime::Tokio)
        .map_err(TelemetryError::Logs)
}

fn init_tracer_provider(
    config: &Config,
    resource: Resource,
) -> Result<opentelemetry_sdk::trace::TracerProvider, TelemetryError> {
    opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(
            opentelemetry_otlp::new_exporter()
                .tonic()
                .with_endpoint(config.otlp_exporter_endpoint.to_string()),
        )
        .with_trace_config(
            opentelemetry_sdk::trace::Config::default().with_resource(resource),
        )
        .install_batch(opentelemetry_sdk::runtime::Tokio)
        .map_err(TelemetryError::Tracing)
}
