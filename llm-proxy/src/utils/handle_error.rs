use std::{
    convert::Infallible,
    fmt,
    future::Future,
    pin::Pin,
    task::{Context, Poll},
};

use futures::ready;
use http::Request;
use pin_project_lite::pin_project;
use tower::{Layer, Service};

use crate::types::response::Response;

/// A [`Layer`] that wraps a [`Service`] and converts errors into [`Response`]s.
pub struct ErrorHandlerLayer<F> {
    error_mapper: F,
}

impl<F: fmt::Debug> fmt::Debug for ErrorHandlerLayer<F> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.debug_struct("ErrorHandlerLayer")
            .field("error_mapper", &self.error_mapper)
            .finish()
    }
}

impl<F: Clone> Clone for ErrorHandlerLayer<F> {
    fn clone(&self) -> Self {
        Self {
            error_mapper: self.error_mapper.clone(),
        }
    }
}

impl<F> ErrorHandlerLayer<F> {
    /// Create a new [`ErrorHandlerLayer`].
    pub const fn new(error_mapper: F) -> Self {
        Self { error_mapper }
    }
}

impl<S, F: Clone> Layer<S> for ErrorHandlerLayer<F> {
    type Service = ErrorHandler<S, F>;

    fn layer(&self, inner: S) -> Self::Service {
        ErrorHandler::new(inner, self.error_mapper.clone())
    }
}

/// A [`Service`] adapter that handles errors by converting them into
/// [`Response`]s.
pub struct ErrorHandler<S, F> {
    inner: S,
    error_mapper: F,
}

impl<S: fmt::Debug, F: fmt::Debug> fmt::Debug for ErrorHandler<S, F> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.debug_struct("ErrorHandler")
            .field("inner", &self.inner)
            .field("error_mapper", &self.error_mapper)
            .finish()
    }
}

impl<S: Clone, F: Clone> Clone for ErrorHandler<S, F> {
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
            error_mapper: self.error_mapper.clone(),
        }
    }
}

impl<S, F> ErrorHandler<S, F> {
    /// Create a new [`ErrorHandler`] wrapping the given service.
    pub const fn new(inner: S, error_mapper: F) -> Self {
        Self {
            inner,
            error_mapper,
        }
    }
}

pin_project! {
    /// Response future for [`CatchPanic`].
    pub struct ResponseFuture<F, E, T> {
        #[pin]
        kind: Kind<F, E, T>,
    }
}

pin_project! {
    #[project = KindProj]
    enum Kind<F, E, T> {
        Errored {
            error: Option<E>,
            error_mapper: Option<T>,
        },
        Future {
            #[pin]
            future: F,
            error_mapper: Option<T>,
        }
    }
}

impl<F, E, T> Future for ResponseFuture<F, E, T>
where
    F: Future<Output = Result<Response, E>>,
    T: Fn(E) -> Response,
{
    type Output = Result<Response, Infallible>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let mut this = self.project();
        match this.kind.as_mut().project() {
            KindProj::Errored {
                error,
                error_mapper,
            } => {
                let error =
                    error.take().expect("future polled after completion");
                let error_mapper = error_mapper
                    .take()
                    .expect("future polled after completion");
                let response = error_mapper(error);
                Poll::Ready(Ok(response))
            }
            KindProj::Future {
                future,
                error_mapper,
            } => match ready!(future.poll(cx)) {
                Ok(res) => Poll::Ready(Ok(res)),
                Err(svc_err) => {
                    let error_mapper = error_mapper
                        .take()
                        .expect("future polled after completion");
                    this.kind.as_mut().set(Kind::Errored {
                        error: Some(svc_err),
                        error_mapper: Some(error_mapper),
                    });
                    Poll::Pending
                }
            },
        }
    }
}

impl<S, F, ReqBody, E> Service<Request<ReqBody>> for ErrorHandler<S, F>
where
    S: Service<Request<ReqBody>, Response = Response, Error = E>
        + Send
        + 'static,
    S::Future: Send + 'static,
    F: Fn(E) -> Response + Clone + Send + 'static,
    ReqBody: Send + 'static,
    E: Send + 'static,
{
    type Response = Response;
    type Error = Infallible;
    type Future = ResponseFuture<S::Future, E, F>;

    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        match self.inner.poll_ready(cx) {
            Poll::Ready(Ok(())) => Poll::Ready(Ok(())),
            Poll::Ready(Err(_)) => {
                tracing::error!("Errored in poll ready");
                Poll::Ready(Ok(()))
            }
            Poll::Pending => Poll::Pending,
        }
    }

    fn call(&mut self, req: Request<ReqBody>) -> Self::Future {
        let future = self.inner.call(req);
        let mapper = self.error_mapper.clone();
        ResponseFuture {
            kind: Kind::Future {
                future,
                error_mapper: Some(mapper),
            },
        }
    }
}
