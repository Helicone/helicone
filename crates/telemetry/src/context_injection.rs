use opentelemetry::Context;

use opentelemetry_http::HeaderInjector;
use opentelemetry::global;

pub struct ContextInjectionLayer;
impl<S> tower::Layer<S> for ContextInjectionLayer {
    type Service = ContextInjectionService<S>;
    fn layer(&self, service: S) -> Self::Service {
        ContextInjectionService { service }
    }
}

#[derive(Debug, Clone)]
pub struct ContextInjectionService<S> {
    service: S,
}
impl<S, B> tower::Service<http::Request<B>> for ContextInjectionService<S>
where
    S: tower::Service<http::Request<B>>,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = S::Future;
    fn poll_ready(&mut self, cx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }
    fn call(&mut self, mut request: http::Request<B>) -> Self::Future {
        inject_context_into_request(&Context::current(), &mut request);
        self.service.call(request)
    }
}

/// Utility function to inject context into mutable request headers
pub fn inject_context_into_request<B>(cx: &Context, req: &mut http::Request<B>) {
    global::get_text_map_propagator(|propagator| {
        propagator.inject_context(cx, &mut HeaderInjector(req.headers_mut()))
    });
}
