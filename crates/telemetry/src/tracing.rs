use http::{HeaderValue, Request};
use opentelemetry::Context;
use opentelemetry::trace::{Span, TracerProvider};
use opentelemetry::{
    global,
    trace::{SpanKind, Tracer},
};
use opentelemetry_http::HeaderExtractor;
use tower_http::request_id::RequestId;

const SERVICE_NAME: &str = "helicone-router";

#[derive(Clone, Default)]
pub struct MakeRequestId {
    propagate: bool,
    service_name: String,
}

impl MakeRequestId {
    #[must_use]
    pub fn new(value: bool, service_name: String) -> Self {
        Self {
            propagate: value,
            service_name,
        }
    }
}

impl tower_http::request_id::MakeRequestId for MakeRequestId {
    fn make_request_id<B>(
        &mut self,
        request: &http::Request<B>,
    ) -> Option<RequestId> {
        use opentelemetry::trace::TraceContextExt;
        use tracing::Span;
        use tracing_opentelemetry::OpenTelemetrySpanExt;

        // let traceparent: Option<TraceParent> =
        //     if let Some(traceparent) = request.headers().get("traceparent") {
        //         if self.propagate {
        //             match FromStr::from_str(traceparent.to_str().ok()?) {
        //                 Ok(traceparent) => Some(traceparent),
        //                 Err(_) => None,
        //             }
        //         } else {
        //             None
        //         }
        //     } else {
        //         None
        //     };

        // if self.propagate {
        //     // let tracer_provider = global::tracer_provider();
        //     // let tracer = tracer_provider.tracer(self.service_name.clone());
            // let parent_cx = extract_context_from_request(&request);
            // tracing::error!("parent_cx: {:?}", parent_cx);
            // // let span = tracer
            // //     .span_builder(SERVICE_NAME)
            // //     .with_kind(SpanKind::Server)
            // //     .start_with_context(&tracer, &parent_cx);



            // let parent_cx = extract_context_from_request(request);
            // Span::current().set_parent(parent_cx);
    
            // global::get_text_map_propagator(|propagator| {
            //     propagator.inject_context(&parent_cx, &mut HeaderInjector(request.headers_mut()))
            // });

        //     tracing::error!("trace_id: {}", trace_id);
        //     let header = HeaderValue::from_str(&trace_id.to_string())
        //         .expect("traceid can always be a header");
        //     Some(RequestId::new(header))
        // } else {
        
            let trace_id =
                Span::current().context().span().span_context().trace_id();
            let header = HeaderValue::from_str(&trace_id.to_string())
                .expect("traceid can always be a header");
            Some(RequestId::new(header))
        // }
    }
}

// struct TraceParent {
//     version: String,
//     trace_id: String,
//     parent_id: String,
//     trace_flags: String,
// }

// impl FromStr for TraceParent {
//     type Err = InvalidTraceParentHeader;

//     fn from_str(s: &str) -> Result<Self, Self::Err> {
//         let parts: Vec<&str> = s.split('-').collect();
//         if parts.len() != 4 {
//             return Err(InvalidTraceParentHeader);
//         }
//         Ok(TraceParent {
//             version: parts[0].to_string(),
//             trace_id: parts[1].to_string(),
//             parent_id: parts[2].to_string(),
//             trace_flags: parts[3].to_string(),
//         })
//     }
// }
// #[derive(Debug)]
// struct InvalidTraceParentHeader;

// impl Display for InvalidTraceParentHeader {
//     fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
//         write!(f, "Invalid traceparent header")
//     }
// }

// impl std::error::Error for InvalidTraceParentHeader {}