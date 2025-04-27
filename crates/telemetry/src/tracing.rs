use http::HeaderValue;
use serde::{Deserialize, Serialize};
use tower_http::request_id::RequestId;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(default, deny_unknown_fields)]
pub struct Config {
    pub enabled: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self { enabled: true }
    }
}

#[derive(Clone, Default)]
pub struct MakeRequestId;

impl tower_http::request_id::MakeRequestId for MakeRequestId {
    fn make_request_id<B>(
        &mut self,
        _request: &http::Request<B>,
    ) -> Option<RequestId> {
        use opentelemetry::trace::TraceContextExt;
        use tracing::Span;
        use tracing_opentelemetry::OpenTelemetrySpanExt;
        let context = Span::current().context();
        let span = context.span();
        let span_context = span.span_context();
        tracing::info!(
            "span_context: {:?}, is_valid: {:?}",
            span_context,
            span_context.is_valid()
        );
        let trace_id =
            Span::current().context().span().span_context().trace_id();
        let header = HeaderValue::from_str(&trace_id.to_string())
            .expect("traceid can always be a header");
        Some(RequestId::new(header))
    }
}
