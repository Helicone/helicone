pub mod make_span;
pub mod tracing;
pub mod utils;
use opentelemetry::{
    TraceId, global,
    trace::{TracerProvider, noop::NoopTextMapPropagator},
};
use opentelemetry_otlp::{
    ExporterBuildError, LogExporter, MetricExporter, SpanExporter,
    WithExportConfig,
};
use opentelemetry_sdk::{
    Resource,
    logs::SdkLoggerProvider,
    metrics::SdkMeterProvider,
    propagation::TraceContextPropagator,
    trace::{IdGenerator, SdkTracerProvider},
};
use serde::{Deserialize, Serialize};
pub use tracing_subscriber::util::TryInitError;
use tracing_subscriber::{
    EnvFilter, Layer, filter::ParseError, layer::SubscriberExt,
    util::SubscriberInitExt,
};
use utils::default_true;
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
    #[serde(default = "default_otlp_endpoint")]
    pub otlp_endpoint: String,
    #[serde(default = "default_true")]
    pub propagate: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            level: default_level(),
            service_name: default_service_name(),
            exporter: Exporter::default(),
            otlp_endpoint: default_otlp_endpoint(),
            propagate: default_true(),
        }
    }
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub enum Exporter {
    Stdout,
    Otlp,
    #[default]
    Both,
}

fn default_service_name() -> String {
    "helicone-router".to_string()
}

fn default_level() -> String {
    "info,llm_proxy=trace".to_string()
}

fn default_otlp_endpoint() -> String {
    "http://localhost:4317/v1/metrics".to_string()
}

#[derive(Debug, thiserror::Error)]
pub enum TelemetryError {
    #[error("Log exporter build error: {0}")]
    LogExporterBuild(ExporterBuildError),
    #[error("Trace exporter build error: {0}")]
    TraceExporterBuild(ExporterBuildError),
    #[error("Metric exporter build error: {0}")]
    MetricExporterBuild(ExporterBuildError),
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

/// Initialize telemetry with the given config.
///
/// # Notes
/// - The reason the `TracerProvider` is not optional is because without it we
///   don't generate trace ids, which is useful to have when
///   debugging/developing.
///
/// # Errors
/// If any of the configuration is invalid.
pub fn init_telemetry(
    config: &Config,
) -> Result<
    (
        Option<SdkLoggerProvider>,
        SdkTracerProvider,
        Option<SdkMeterProvider>,
    ),
    TelemetryError,
> {
    let resource = resource(config);

    if config.propagate {
        global::set_text_map_propagator(TraceContextPropagator::new());
    } else {
        global::set_text_map_propagator(NoopTextMapPropagator::new());
    }

    match config.exporter {
        Exporter::Stdout => {
            let tracer_provider = init_stdout(&resource, config)?;
            Ok((None, tracer_provider, None))
        }
        Exporter::Otlp => {
            let (logger_provider, tracer_provider, metrics_provider) =
                init_otlp(config)?;
            Ok((
                Some(logger_provider),
                tracer_provider,
                Some(metrics_provider),
            ))
        }
        Exporter::Both => {
            let (logger_provider, tracer_provider, metrics_provider) =
                init_otlp_with_stdout(config)?;
            Ok((
                Some(logger_provider),
                tracer_provider,
                Some(metrics_provider),
            ))
        }
    }
}

fn init_otlp(
    config: &Config,
) -> Result<
    (SdkLoggerProvider, SdkTracerProvider, SdkMeterProvider),
    TelemetryError,
> {
    let resource = resource(config);
    // logging
    let logger_provider = logger_provider(config, resource.clone())
        .map_err(TelemetryError::LogExporterBuild)?;
    let otel_layer =
        opentelemetry_appender_tracing::layer::OpenTelemetryTracingBridge::new(
            &logger_provider,
        );
    let filter = env_filter(config)?;
    let otel_layer = otel_layer.with_filter(filter);

    // tracing
    let tracer_provider = tracer_provider(config, resource.clone())
        .map_err(TelemetryError::TraceExporterBuild)?;
    let tracer = tracer_provider.tracer(config.service_name.clone());
    let filter = env_filter(config)?;
    let tracing_layer = tracing_opentelemetry::layer()
        .with_tracer(tracer)
        .with_filter(filter);

    tracing_subscriber::registry()
        .with(tracing_layer)
        .with(otel_layer)
        .try_init()?;

    // metrics
    let metrics_provider = metrics_provider(config, resource.clone())
        .map_err(TelemetryError::MetricExporterBuild)?;

    global::set_meter_provider(metrics_provider.clone());
    global::set_tracer_provider(tracer_provider.clone());

    log_panics::init();

    Ok((logger_provider, tracer_provider, metrics_provider))
}

fn init_otlp_with_stdout(
    config: &Config,
) -> Result<
    (SdkLoggerProvider, SdkTracerProvider, SdkMeterProvider),
    TelemetryError,
> {
    let resource = resource(config);
    let logger_provider = logger_provider(config, resource.clone())
        .map_err(TelemetryError::LogExporterBuild)?;
    let otel_layer =
        opentelemetry_appender_tracing::layer::OpenTelemetryTracingBridge::new(
            &logger_provider,
        );
    let filter = env_filter(config)?;
    let otel_layer = otel_layer.with_filter(filter);

    let tracer_provider = tracer_provider(config, resource.clone())
        .map_err(TelemetryError::TraceExporterBuild)?;
    let tracer = tracer_provider.tracer(config.service_name.clone());
    let filter = env_filter(config)?;
    let tracing_layer = tracing_opentelemetry::layer()
        .with_tracer(tracer)
        .with_filter(filter);

    let logger_layer = tracing_subscriber::fmt::layer()
        .pretty()
        .with_file(true)
        .with_line_number(true)
        .with_filter(env_filter(config)?);

    tracing_subscriber::registry()
        .with(logger_layer)
        .with(tracing_layer)
        .with(otel_layer)
        .try_init()?;

    // metrics
    let metrics_provider = metrics_provider(config, resource.clone())
        .map_err(TelemetryError::MetricExporterBuild)?;

    global::set_meter_provider(metrics_provider.clone());
    global::set_tracer_provider(tracer_provider.clone());
    log_panics::init();

    Ok((logger_provider, tracer_provider, metrics_provider))
}

fn init_stdout(
    resource: &Resource,
    config: &Config,
) -> Result<SdkTracerProvider, TelemetryError> {
    // logging
    let fmt_layer = tracing_subscriber::fmt::layer()
        .pretty()
        .with_file(true)
        .with_line_number(true)
        .with_filter(env_filter(config)?);
    let registry = tracing_subscriber::registry().with(fmt_layer);

    // tracing
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
        .add_directive("opentelemetry_sdk=off".parse()?)
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
        Exporter::Otlp | Exporter::Both => {
            let exporter = SpanExporter::builder()
                .with_tonic()
                .with_endpoint(config.otlp_endpoint.clone())
                .build()?;
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
    config: &Config,
    resource: Resource,
) -> Result<SdkLoggerProvider, ExporterBuildError> {
    let exporter = LogExporter::builder()
        .with_tonic()
        .with_endpoint(config.otlp_endpoint.clone())
        .build()?;
    Ok(SdkLoggerProvider::builder()
        .with_resource(resource)
        .with_batch_exporter(exporter)
        .build())
}

fn metrics_provider(
    config: &Config,
    resource: Resource,
) -> Result<SdkMeterProvider, ExporterBuildError> {
    let exporter = MetricExporter::builder()
        .with_tonic()
        .with_endpoint(config.otlp_endpoint.clone())
        .build()?;
    Ok(SdkMeterProvider::builder()
        .with_periodic_exporter(exporter)
        .with_resource(resource)
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
