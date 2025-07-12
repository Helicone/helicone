use std::{
    future::Future,
    pin::Pin,
    task::{Context, Poll},
};

use futures::ready;
use tower_otel_http_metrics::ResponseAttributeExtractor;

use crate::{
    app_state::AppState, metrics::attribute_extractor::AttributeExtractor,
};

#[derive(Clone)]
pub struct Layer {
    app_state: AppState,
}

impl Layer {
    #[must_use]
    pub fn new(app_state: AppState) -> Self {
        Self { app_state }
    }
}

impl<S> tower::layer::Layer<S> for Layer {
    type Service = Service<S>;

    fn layer(&self, service: S) -> Self::Service {
        Service {
            inner: service,
            app_state: self.app_state.clone(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct Service<S> {
    inner: S,
    app_state: AppState,
}

pin_project_lite::pin_project! {
    #[derive(Debug)]
    pub struct ResponseFuture<F> {
        #[pin]
        inner: F,
        app_state: AppState,
    }
}

impl<F, RespBody, Error> Future for ResponseFuture<F>
where
    F: Future<Output = Result<http::Response<RespBody>, Error>>,
{
    type Output = Result<http::Response<RespBody>, Error>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let this = self.project();
        let response = ready!(this.inner.poll(cx));
        match response {
            Ok(resp) => {
                let attributes = AttributeExtractor.extract_attributes(&resp);
                this.app_state.0.metrics.response_count.add(1, &attributes);
                Poll::Ready(Ok(resp))
            }
            Err(e) => Poll::Ready(Err(e)),
        }
    }
}

impl<S, Request, RespBody> tower::Service<Request> for Service<S>
where
    S: tower::Service<Request, Response = http::Response<RespBody>>,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = ResponseFuture<S::Future>;

    fn poll_ready(
        &mut self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, request: Request) -> Self::Future {
        self.app_state.0.metrics.request_count.add(1, &[]);
        let inner = self.inner.call(request);
        ResponseFuture {
            inner,
            app_state: self.app_state.clone(),
        }
    }
}
