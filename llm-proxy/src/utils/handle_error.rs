use std::{
    convert::Infallible,
    future::Future,
    pin::Pin,
    task::{Context, Poll},
};

use axum_core::response::IntoResponse;
use futures::ready;
use http::Request;
use pin_project_lite::pin_project;
use tower::{Layer, Service};

use crate::types::response::Response;

/// A [`Layer`] that wraps a [`Service`] and converts errors into [`Response`]s.
#[derive(Debug, Clone)]
pub struct ErrorHandlerLayer;

impl<S> Layer<S> for ErrorHandlerLayer
where
    S: tower::Service<crate::types::request::Request>,
    S::Error: IntoResponse,
{
    type Service = ErrorHandler<S>;

    fn layer(&self, inner: S) -> Self::Service {
        ErrorHandler::new(inner)
    }
}

/// A [`Service`] adapter that handles errors by converting them into
/// [`Response`]s.
#[derive(Debug, Clone)]
pub struct ErrorHandler<S> {
    inner: S,
}

impl<S> ErrorHandler<S>
where
    S: tower::Service<crate::types::request::Request>,
    S::Error: IntoResponse,
{
    /// Create a new [`ErrorHandler`] wrapping the given service.
    pub const fn new(inner: S) -> Self {
        Self { inner }
    }
}

pin_project! {
    /// Response future for [`CatchPanic`].
    pub struct ResponseFuture<F, E> {
        #[pin]
        kind: Kind<F, E>,
    }
}

pin_project! {
    #[project = KindProj]
    enum Kind<F, E> {
        Errored {
            error: Option<E>,
        },
        Future {
            #[pin]
            future: F,
        }
    }
}

impl<F, E> Future for ResponseFuture<F, E>
where
    F: Future<Output = Result<Response, E>>,
    E: IntoResponse,
{
    type Output = Result<Response, Infallible>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let mut this = self.project();
        match this.kind.as_mut().project() {
            KindProj::Errored { error } => {
                let error =
                    error.take().expect("future polled after completion");
                let response = error.into_response();
                Poll::Ready(Ok(response))
            }
            KindProj::Future { future } => match ready!(future.poll(cx)) {
                Ok(res) => Poll::Ready(Ok(res)),
                Err(svc_err) => {
                    this.kind.as_mut().set(Kind::Errored {
                        error: Some(svc_err),
                    });
                    Poll::Pending
                }
            },
        }
    }
}

impl<S, ReqBody, E> Service<Request<ReqBody>> for ErrorHandler<S>
where
    S: Service<Request<ReqBody>, Response = Response, Error = E>
        + Send
        + 'static,
    S::Future: Send + 'static,
    S::Error: IntoResponse + std::fmt::Display,
    ReqBody: Send + 'static,
    E: Send + 'static + std::fmt::Display,
{
    type Response = Response;
    type Error = Infallible;
    type Future = ResponseFuture<S::Future, E>;

    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        match self.inner.poll_ready(cx) {
            Poll::Ready(Ok(())) => Poll::Ready(Ok(())),
            Poll::Ready(Err(e)) => {
                tracing::error!(error = %e, "Inner service poll_ready returned error");
                Poll::Pending
            }
            Poll::Pending => Poll::Pending,
        }
    }

    fn call(&mut self, req: Request<ReqBody>) -> Self::Future {
        let future = self.inner.call(req);
        ResponseFuture {
            kind: Kind::Future { future },
        }
    }
}
