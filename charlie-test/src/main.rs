use opentelemetry::{
    Context, global,
    trace::{SpanKind, TraceContextExt, Tracer},
};
use opentelemetry_appender_tracing::layer::OpenTelemetryTracingBridge;
use opentelemetry_http::HeaderInjector;
use opentelemetry_sdk::{
    logs::SdkLoggerProvider, propagation::TraceContextPropagator,
    trace::SdkTracerProvider,
};
use opentelemetry_stdout::{LogExporter, SpanExporter};
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use std::collections::HashMap;
use http::HeaderMap;

fn init_tracer() -> SdkTracerProvider {
    global::set_text_map_propagator(TraceContextPropagator::new());
    // Use a simple exporter that prints to stdout for easy verification
    let provider = SdkTracerProvider::builder()
        .with_simple_exporter(SpanExporter::default())
        .build();
    global::set_tracer_provider(provider.clone());
    provider
}

fn init_logs() -> SdkLoggerProvider {
    let logger_provider = SdkLoggerProvider::builder()
        .with_simple_exporter(LogExporter::default())
        .build();
    let otel_layer = OpenTelemetryTracingBridge::new(&logger_provider);
    tracing_subscriber::registry()
        .with(otel_layer)
        .with(tracing_subscriber::fmt::layer()) // Add a formatted layer for readable output
        .with(tracing_subscriber::filter::LevelFilter::INFO)
        .init();
    logger_provider
}

// Function to simulate extracting context from an incoming request
fn extract_and_verify_context(headers: &HashMap<String, String>) -> Context {
    let parent_context = global::get_text_map_propagator(|propagator| {
        propagator.extract(&HeaderMapCarrier(headers))
    });
    
    // Get the span from the context
    let span = parent_context.span();
    // Get the span context
    let span_context = span.span_context();
    
    // Log the extracted trace and span IDs to verify propagation
    if span_context.is_valid() {
        info!(
            trace_id = %span_context.trace_id(),
            span_id = %span_context.span_id(),
            "Successfully extracted valid trace context"
        );
    } else {
        info!("Extracted context is not valid");
    }
    
    parent_context
}

// A simple carrier to adapt HashMap to the HeaderExtractor
struct HeaderMapCarrier<'a>(&'a HashMap<String, String>);

impl<'a> opentelemetry::propagation::Extractor for HeaderMapCarrier<'a> {
    fn get(&self, key: &str) -> Option<&str> {
        self.0.get(key).map(|v| v.as_str())
    }

    fn keys(&self) -> Vec<&str> {
        self.0.keys().map(|k| k.as_str()).collect()
    }
}

pub async fn test_trace_propagation() -> Result<(), Box<dyn std::error::Error + Send + Sync + 'static>> {
    // Create a root span
    let tracer = global::tracer("trace-test");
    let root_span = tracer
        .span_builder("root-span")
        .with_kind(SpanKind::Server)
        .start(&tracer);
    
    let root_cx = Context::current_with_span(root_span);
    
    // Create an empty headers map and inject the current context
    let mut header_map = HeaderMap::new();
    global::get_text_map_propagator(|propagator| {
        propagator.inject_context(&root_cx, &mut HeaderInjector(&mut header_map))
    });
    
    // Convert HeaderMap to HashMap for our test
    let mut headers = HashMap::new();
    for (key, value) in header_map.iter() {
        if let Ok(v) = value.to_str() {
            headers.insert(key.as_str().to_string(), v.to_string());
        }
    }
    
    // Print the injected headers to see what was actually injected
    info!(headers = ?headers, "Injected trace context into headers");
    
    // Now extract the context back and verify it matches
    let extracted_cx = extract_and_verify_context(&headers);
    
    // Create a child span using the extracted context
    let child_span = tracer
        .span_builder("child-span")
        .with_kind(SpanKind::Client)
        .start(&tracer);
    
    let child_cx = extracted_cx.with_span(child_span);
    
    // Get the trace and span IDs from both contexts and compare
    let root_binding = root_cx.span();
    let root_span_context = root_binding.span_context();

    let child_binding = child_cx.span();
    let child_span_context = child_binding.span_context();
    
    if root_span_context.is_valid() && child_span_context.is_valid() {
        info!(
            root_trace_id = %root_span_context.trace_id(),
            root_span_id = %root_span_context.span_id(),
            child_trace_id = %child_span_context.trace_id(),
            child_span_id = %child_span_context.span_id(),
            "Propagation test complete - trace IDs should match while span IDs differ"
        );
        
        // Verify that trace IDs match but span IDs differ (as expected)
        assert_eq!(
            root_span_context.trace_id(), 
            child_span_context.trace_id(),
            "Trace propagation failed: trace IDs don't match"
        );
        assert_ne!(
            root_span_context.span_id(),
            child_span_context.span_id(),
            "Span IDs should be different"
        );
        
        info!("✅ Trace propagation test passed!");
    } else {
        info!("❌ Invalid span context detected");
    }
    
    Ok(())
}

#[tokio::main]
async fn main() {
    let tracer_provider = init_tracer();
    let logger_provider = init_logs();
    
    info!("Starting trace propagation test");
    let _ = test_trace_propagation().await;
    
    // Optional: Your original send_request function could still be called here
    // send_request().await?;
    
    tracer_provider.shutdown().expect("Shutdown provider failed");
    logger_provider.shutdown().expect("Shutdown provider failed");
}