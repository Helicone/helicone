//! Credits to tower-http. TODO: license
use std::{
    any::Any,
    future::Future,
    panic::AssertUnwindSafe,
    pin::Pin,
    task::{Context, Poll, ready},
};

use bytes::Bytes;
use futures::future::{CatchUnwind, FutureExt};
use hyper::body::Body;
use pin_project_lite::pin_project;
use tower::{BoxError, Layer, Service};
use tower_http::catch_panic::{DefaultResponseForPanic, ResponseForPanic};

use crate::types::{request::Request, response::Response};

/// Layer that applies the [`CatchPanic`] middleware that catches panics and
/// converts them into `500 Internal Server` responses.
#[derive(Debug, Clone, Copy, Default)]
pub struct CatchPanicLayer<T> {
    panic_handler: T,
}

impl CatchPanicLayer<DefaultResponseForPanic> {
    /// Create a new `CatchPanicLayer` with the default panic handler.
    pub fn new() -> Self {
        CatchPanicLayer {
            panic_handler: DefaultResponseForPanic::default(),
        }
    }
}

impl<T> CatchPanicLayer<T> {
    /// Create a new `CatchPanicLayer` with a custom panic handler.
    pub fn custom(panic_handler: T) -> Self
    where
        T: ResponseForPanic,
    {
        Self { panic_handler }
    }
}

impl<T, S> Layer<S> for CatchPanicLayer<T>
where
    T: Clone,
{
    type Service = CatchPanic<S, T>;

    fn layer(&self, inner: S) -> Self::Service {
        CatchPanic {
            inner,
            panic_handler: self.panic_handler.clone(),
        }
    }
}

/// Middleware that catches panics and converts them into `500 Internal Server`
/// responses.
///
/// See the [module docs](self) for an example.
#[derive(Debug, Clone, Copy)]
pub struct CatchPanic<S, T> {
    inner: S,
    panic_handler: T,
}

impl<S> CatchPanic<S, DefaultResponseForPanic> {
    /// Create a new `CatchPanic` with the default panic handler.
    pub fn new(inner: S) -> Self {
        Self {
            inner,
            panic_handler: DefaultResponseForPanic::default(),
        }
    }
}

impl<S, T> Service<Request> for CatchPanic<S, T>
where
    S: Service<Request, Response = Response>,
    T: ResponseForPanic + Clone,
    T::ResponseBody: Body<Data = Bytes> + Send + Sync + 'static,
    <T::ResponseBody as Body>::Error: Into<BoxError>,
{
    type Response = Response;
    type Error = S::Error;
    type Future = ResponseFuture<S::Future, T>;

    #[inline]
    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: Request) -> Self::Future {
        match std::panic::catch_unwind(AssertUnwindSafe(|| {
            self.inner.call(req)
        })) {
            Ok(future) => ResponseFuture {
                kind: Kind::Future {
                    future: AssertUnwindSafe(future).catch_unwind(),
                    panic_handler: Some(self.panic_handler.clone()),
                },
            },
            Err(panic_err) => ResponseFuture {
                kind: Kind::Panicked {
                    panic_err: Some(panic_err),
                    panic_handler: Some(self.panic_handler.clone()),
                },
            },
        }
    }
}

pin_project! {
    /// Response future for [`CatchPanic`].
    pub struct ResponseFuture<F, T> {
        #[pin]
        kind: Kind<F, T>,
    }
}

pin_project! {
    #[project = KindProj]
    enum Kind<F, T> {
        Panicked {
            panic_err: Option<Box<dyn Any + Send + 'static>>,
            panic_handler: Option<T>,
        },
        Future {
            #[pin]
            future: CatchUnwind<AssertUnwindSafe<F>>,
            panic_handler: Option<T>,
        }
    }
}

impl<F, E, T> Future for ResponseFuture<F, T>
where
    F: Future<Output = Result<Response, E>>,
    T: ResponseForPanic,
    T::ResponseBody: Body<Data = Bytes> + Send + Sync + 'static,
    <T::ResponseBody as Body>::Error: Into<BoxError>,
{
    type Output = Result<Response, E>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        match self.project().kind.project() {
            KindProj::Panicked {
                panic_err,
                panic_handler,
            } => {
                let panic_handler = panic_handler
                    .take()
                    .expect("future polled after completion");
                let panic_err =
                    panic_err.take().expect("future polled after completion");
                Poll::Ready(Ok(response_for_panic(panic_handler, panic_err)))
            }
            KindProj::Future {
                future,
                panic_handler,
            } => match ready!(future.poll(cx)) {
                Ok(Ok(res)) => Poll::Ready(Ok(res)),
                Ok(Err(svc_err)) => Poll::Ready(Err(svc_err)),
                Err(panic_err) => Poll::Ready(Ok(response_for_panic(
                    panic_handler
                        .take()
                        .expect("future polled after completion"),
                    panic_err,
                ))),
            },
        }
    }
}

fn response_for_panic<T>(
    mut panic_handler: T,
    err: Box<dyn Any + Send + 'static>,
) -> Response
where
    T: ResponseForPanic,
    T::ResponseBody: Body<Data = Bytes> + Send + Sync + 'static,
    <T::ResponseBody as Body>::Error: Into<BoxError>,
{
    panic_handler
        .response_for_panic(err)
        .map(reqwest::Body::wrap)
}
