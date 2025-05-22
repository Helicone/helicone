use http::{HeaderValue};
use tower_http::request_id::RequestId;


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
        let trace_id = Span::current().context().span().span_context().trace_id();
        let header = HeaderValue::from_str(&trace_id.to_string())
                .expect("traceid can always be a header");
        Some(RequestId::new(header))
    }
}
