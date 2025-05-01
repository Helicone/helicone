pub mod tracing;

use opentelemetry::{TraceId, trace::TracerProvider};
use opentelemetry_otlp::{ExporterBuildError, LogExporter, SpanExporter};
use opentelemetry_sdk::{
    Resource,
    logs::SdkLoggerProvider,
    trace::{IdGenerator, SdkTracerProvider},
};
use serde::{Deserialize, Serialize};
pub use tracing_subscriber::util::TryInitError;
use tracing_subscriber::{
    EnvFilter, Layer, filter::ParseError, layer::SubscriberExt,
    util::SubscriberInitExt,
};
use uuid::Uuid;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(default, deny_unknown_fields, rename_all = "kebab-case")]
pub struct Config {
    /// Logging and tracing level in the env logger format.
    #[serde(default = "default_level")]
    pub level: String,
    #[serde(default = "default_service_name")]
    pub service_name: String,
    #[serde(default)]
    pub exporter: Exporter,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            level: default_level(),
            service_name: default_service_name(),
            exporter: Exporter::default(),
        }
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub enum Exporter {
    Stdout,
    // This should be configured for http://localhost:4317
    Otlp,
}

impl Default for Exporter {
    fn default() -> Self {
        Self::Stdout
    }
}

fn default_service_name() -> String {
    "helicone-router".to_string()
}

fn default_level() -> String {
    "info,llm_proxy=trace".to_string()
}

#[derive(Debug, thiserror::Error)]
pub enum TelemetryError {
    #[error("Log exporter build error: {0}")]
    LogExporterBuild(ExporterBuildError),
    #[error("Trace exporter build error: {0}")]
    TraceExporterBuild(ExporterBuildError),
    #[error("Invalid log directive: {0}")]
    InvalidLogDirective(#[from] ParseError),
    #[error("Subscriber error: {0}")]
    Subscriber(#[from] TryInitError),
    #[error("Otel http metrics error")]
    OtelHttpMetrics,
}

fn resource(config: &Config) -> Resource {
    Resource::builder()
        .with_service_name(config.service_name.clone())
        .build()
}

pub fn init_telemetry(
    config: &Config,
) -> Result<(Option<SdkLoggerProvider>, SdkTracerProvider), TelemetryError> {
    let resource = resource(config);
    match config.exporter {
        Exporter::Stdout => {
            let tracer_provider = init_stdout(resource, config)?;
            Ok((None, tracer_provider))
        }
        Exporter::Otlp => {
            let (logger_provider, tracer_provider) = init_otlp(config)?;
            Ok((Some(logger_provider), tracer_provider))
        }
    }
}

fn init_otlp(
    config: &Config,
) -> Result<(SdkLoggerProvider, SdkTracerProvider), TelemetryError> {
    let resource = resource(config);
    let logger_provider = logger_provider(resource.clone())
        .map_err(TelemetryError::LogExporterBuild)?;
    let otel_layer =
        opentelemetry_appender_tracing::layer::OpenTelemetryTracingBridge::new(
            &logger_provider,
        );
    let filter = env_filter(config)?;
    let otel_layer = otel_layer.with_filter(filter);
    let fmt_layer = tracing_subscriber::fmt::layer()
        .compact()
        .with_file(true)
        .with_line_number(true)
        .with_filter(env_filter(config)?)
        .boxed();
    let registry = tracing_subscriber::registry()
        .with(otel_layer)
        .with(fmt_layer);

    let tracer_provider = tracer_provider(config, resource.clone())
        .map_err(TelemetryError::TraceExporterBuild)?;
    let tracer = tracer_provider.tracer(config.service_name.clone());
    let filter = env_filter(config)?;
    let tracing_layer = tracing_opentelemetry::layer()
        .with_tracer(tracer)
        .with_filter(filter);
    registry.with(tracing_layer).try_init()?;
    opentelemetry::global::set_tracer_provider(tracer_provider.clone());

    log_panics::init();

    Ok((logger_provider, tracer_provider))
}

fn init_stdout(
    resource: Resource,
    config: &Config,
) -> Result<SdkTracerProvider, TelemetryError> {
    let fmt_layer = tracing_subscriber::fmt::layer()
        .pretty()
        .with_file(true)
        .with_line_number(true)
        .with_filter(env_filter(config)?)
        .boxed();
    let registry = tracing_subscriber::registry().with(fmt_layer);

    let tracer_provider = tracer_provider(config, resource.clone())
        .map_err(TelemetryError::TraceExporterBuild)?;
    let tracer = tracer_provider.tracer(config.service_name.clone());
    let filter = env_filter(config)?;
    let tracing_layer = tracing_opentelemetry::layer()
        .with_tracer(tracer)
        .with_filter(filter);
    registry.with(tracing_layer).try_init()?;
    opentelemetry::global::set_tracer_provider(tracer_provider.clone());

    log_panics::init();

    Ok(tracer_provider)
}

fn env_filter(config: &Config) -> Result<EnvFilter, TelemetryError> {
    // we purposely avoid the EnvFilter::new API so we can catch invalid
    // directives
    let filter = EnvFilter::new(config.level.clone())
        // https://github.com/open-telemetry/opentelemetry-rust/issues/2877
        .add_directive("hyper=off".parse()?)
        .add_directive("tonic=off".parse()?)
        .add_directive("h2=off".parse()?)
        .add_directive("reqwest=off".parse()?);
    Ok(filter)
}

fn tracer_provider(
    config: &Config,
    resource: Resource,
) -> Result<SdkTracerProvider, ExporterBuildError> {
    match &config.exporter {
        Exporter::Stdout => {
            Ok(SdkTracerProvider::builder()
                .with_resource(resource)
                // we don't need an exporter here for stdout since we really
                // just want the tracer to generate trace ids
                .with_id_generator(UuidGenerator)
                .with_max_events_per_span(64)
                .with_max_attributes_per_span(16)
                .build())
        }
        Exporter::Otlp => {
            let exporter = SpanExporter::builder().with_tonic().build()?;
            let provider = SdkTracerProvider::builder()
                .with_resource(resource)
                .with_batch_exporter(exporter)
                .with_id_generator(UuidGenerator)
                .with_max_events_per_span(64)
                .with_max_attributes_per_span(16)
                .build();
            Ok(provider)
        }
    }
}

fn logger_provider(
    resource: Resource,
) -> Result<SdkLoggerProvider, ExporterBuildError> {
    let exporter = LogExporter::builder().with_tonic().build()?;
    Ok(SdkLoggerProvider::builder()
        .with_resource(resource)
        .with_batch_exporter(exporter)
        .build())
}

#[derive(Debug)]
pub struct UuidGenerator;

impl IdGenerator for UuidGenerator {
    fn new_trace_id(&self) -> opentelemetry::TraceId {
        TraceId::from(Uuid::new_v4().as_u128())
    }

    fn new_span_id(&self) -> opentelemetry::SpanId {
        opentelemetry::SpanId::from(Uuid::new_v4().as_u64_pair().0)
    }
}
