//! Middleware to turn [`Service`] errors into [`Response`]s.
use crate::response::IntoResponse;
use http::{Request, Response};
use tower::{Layer, Service};
use std::{convert::Infallible, fmt};

/// A [`Layer`] that wraps a [`Service`] and converts errors into [`Response`]s.
#[derive(Debug, Copy, Clone)]
pub struct ErrorHandlerLayer;

impl<S> Layer<S> for ErrorHandlerLayer {
    type Service = ErrorHandler<S>;

    fn layer(&self, inner: S) -> Self::Service {
        ErrorHandler::new(inner)
    }
}

/// A [`Service`] adapter that handles errors by converting them into [`Response`]s.
#[derive(Debug, Clone)]
pub struct ErrorHandler<S> {
    inner: S,
}

impl<S> ErrorHandler<S> {
    /// Create a new [`ErrorHandler`] wrapping the given service.
    pub const fn new(inner: S) -> Self {
        Self {
            inner,
        }
    }
}

impl<S, State, Body> Service<Request<Body>> for ErrorHandler<S>
where
    S: Service<Request<Body>, Response: IntoResponse, Error: IntoResponse>,
    State: Clone + Send + Sync + 'static,
    Body: Send + 'static,
{
    type Response = Response;
    type Error = Infallible;

    async fn serve(
        &self,
        ctx: Context<State>,
        req: Request<Body>,
    ) -> Result<Self::Response, Self::Error> {
        match self.inner.serve(ctx, req).await {
            Ok(response) => Ok(response.into_response()),
            Err(error) => Ok(error.into_response()),
        }
    }
}

impl<S, F, R, State, Body> Service<State, Request<Body>> for ErrorHandler<S, F>
where
    S: Service<State, Request<Body>, Response: IntoResponse>,
    F: Fn(S::Error) -> R + Clone + Send + Sync + 'static,
    R: IntoResponse + 'static,
    State: Clone + Send + Sync + 'static,
    Body: Send + 'static,
{
    type Response = Response;
    type Error = Infallible;

    async fn serve(
        &self,
        ctx: Context<State>,
        req: Request<Body>,
    ) -> Result<Self::Response, Self::Error> {
        match self.inner.serve(ctx, req).await {
            Ok(response) => Ok(response.into_response()),
            Err(error) => Ok((self.error_mapper)(error).into_response()),
        }
    }
}
