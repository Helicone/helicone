use http_body_util::Full;
use hyper_util::{client::legacy::Client, rt::TokioExecutor};
use opentelemetry::{
    Context, global,
    trace::{Span, SpanKind, TraceContextExt, Tracer},
};
use opentelemetry_appender_tracing::layer::OpenTelemetryTracingBridge;
use opentelemetry_http::{Bytes, HeaderInjector};
use opentelemetry_otlp::{SpanExporter, WithExportConfig};
use opentelemetry_sdk::{
    logs::SdkLoggerProvider, propagation::TraceContextPropagator,
    trace::SdkTracerProvider,
};
use opentelemetry_stdout::LogExporter;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

fn init_tracer() -> SdkTracerProvider {
    global::set_text_map_propagator(TraceContextPropagator::new());
    // Install stdout exporter pipeline to be able to retrieve the collected
    // spans. For the demonstration, use `Sampler::AlwaysOn` sampler to
    // sample all traces.
    let provider = SdkTracerProvider::builder()
        .with_batch_exporter(
            SpanExporter::builder()
                .with_tonic()
                .with_endpoint("http://localhost:4317/v1/metrics")
                .build()
                .unwrap(),
        )
        .build();

    global::set_tracer_provider(provider.clone());
    provider
}

fn init_logs() -> SdkLoggerProvider {
    // Setup tracerprovider with stdout exporter
    // that prints the spans to stdout.
    let logger_provider = SdkLoggerProvider::builder()
        .with_simple_exporter(LogExporter::default())
        .build();
    let otel_layer = OpenTelemetryTracingBridge::new(&logger_provider);
    tracing_subscriber::registry()
        .with(otel_layer)
        .with(tracing_subscriber::filter::LevelFilter::INFO)
        .init();

    logger_provider
}

async fn send_request(
    url: &str,
    body_content: &str,
    span_name: &str,
) -> std::result::Result<(), Box<dyn std::error::Error + Send + Sync + 'static>>
{
    let client = Client::builder(TokioExecutor::new()).build_http();
    let tracer = global::tracer("");
    let span = tracer
        .span_builder(String::from(span_name))
        .with_kind(SpanKind::Client)
        .start(&tracer);

    let span_id = span.span_context().span_id().to_string();
    let span_context = span.span_context();
    info!(
        trace_id = span_context.trace_id().to_string(),
        span_id = span_id,
        "client trace_id"
    );
    let cx = Context::current_with_span(span);

    let mut req = hyper::Request::builder().uri(url).method("POST");
    global::get_text_map_propagator(|propagator| {
        propagator.inject_context(
            &cx,
            &mut HeaderInjector(req.headers_mut().unwrap()),
        )
    });
    req.headers_mut()
        .unwrap()
        .insert("baggage", "is_synthetic=true".parse().unwrap());

    let res = client
        .request(req.body(Full::new(Bytes::from(body_content.to_string())))?)
        .await?;

    let x_req_id = res.headers().get("x-request-id").unwrap().to_str().unwrap();

    info!(name: "ResponseReceived", status = res.status().to_string(), message = "Response received", x_req_id = x_req_id);

    Ok(())
}

#[tokio::main]
async fn main()
-> std::result::Result<(), Box<dyn std::error::Error + Send + Sync + 'static>> {
    let tracer_provider = init_tracer();
    let logger_provider = init_logs();

    send_request(
        "http://localhost:8080/router/default/v1/chat/completions",
        r#"{
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant that can answer questions and help with tasks."
                },
                {
                    "role": "user",
                    "content": "hello world"
                }
            ],
            "max_tokens": 400
        }"#,
        "greptile",
    )
    .await?;

    tracer_provider
        .shutdown()
        .expect("Shutdown provider failed");
    logger_provider
        .shutdown()
        .expect("Shutdown provider failed");
    Ok(())
}
