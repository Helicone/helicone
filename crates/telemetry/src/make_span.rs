use http::Request;
use opentelemetry::{global, trace::TraceContextExt, Context};
use opentelemetry_http::{HeaderExtractor, HeaderInjector};
use tower_http::trace::MakeSpan;
use tracing::{Level, Span};
use tracing_opentelemetry::OpenTelemetrySpanExt;

#[derive(Debug, Clone)]
pub struct SpanFactory {
    level: Level,
}

impl SpanFactory {
    /// Create a new `SpanFactory`.
    #[must_use]
    pub fn new() -> Self {
        Self {
            level: Level::DEBUG,
        }
    }

    /// Set the [`Level`] used for the [tracing span].
    ///
    /// Defaults to [`Level::DEBUG`].
    ///
    /// [tracing span]: https://docs.rs/tracing/latest/tracing/#spans
    #[must_use]
    pub fn level(mut self, level: Level) -> Self {
        self.level = level;
        self
    }
}

impl Default for SpanFactory {
    fn default() -> Self {
        Self::new()
    }
}

impl<B> MakeSpan<B> for SpanFactory {
    fn make_span(&mut self, request: &Request<B>) -> Span {
        // This ugly macro is needed, unfortunately, because `tracing::span!`
        // required the level argument to be static. Meaning we can't just pass
        // `self.level`.
        macro_rules! make_span {
            ($level:expr) => {
                tracing::span!(
                    $level,
                    "request",
                    trace_id = tracing::field::Empty,
                )
            }
        }

        let span = match self.level {
            Level::ERROR => make_span!(Level::ERROR),
            Level::WARN => make_span!(Level::WARN),
            Level::INFO => make_span!(Level::INFO),
            Level::DEBUG => make_span!(Level::DEBUG),
            Level::TRACE => make_span!(Level::TRACE),
        };

        let parent_cx = extract_context_from_request(request);
        span.set_parent(parent_cx);


        let trace_id = span.context().span().span_context().trace_id();

        let serialized_trace_id = trace_id.to_string();
        span.record("trace_id", &serialized_trace_id);
        span
    }
}

fn extract_context_from_request<B>(req: &Request<B>) -> Context {
    global::get_text_map_propagator(|propagator| {
        propagator.extract(&HeaderExtractor(req.headers()))
    })
}


