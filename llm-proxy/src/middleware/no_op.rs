use std::task::{Context, Poll};

use futures::future::BoxFuture;

use crate::{app::AppState, error::api::Error, types::request::Request};

#[derive(Debug)]
pub struct Service<S> {
    inner: S,
    app_state: AppState,
}

impl<S> Clone for Service<S>
where
    S: Clone,
{
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
            app_state: self.app_state.clone(),
        }
    }
}

impl<S> Service<S> {
    pub fn new(inner: S, app_state: AppState) -> Self {
        Self { inner, app_state }
    }
}

impl<S> tower::Service<Request> for Service<S>
where
    S: tower::Service<Request> + Clone + Send + 'static,
    S::Future: Send + 'static,
    S::Response: Send + 'static,
    S::Error: Into<Error> + Send + Sync + 'static,
{
    type Response = S::Response;
    type Error = Error;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        tracing::trace!("NoOpService::poll_ready");
        self.inner.poll_ready(cx).map_err(Into::into)
    }

    #[tracing::instrument(name = "NoOpService::call", skip(self, req))]
    fn call(&mut self, req: Request) -> Self::Future {
        tracing::info!("NoOpService::call");
        let mut inner = self.inner.clone();
        Box::pin(async move { inner.call(req).await.map_err(Into::into) })
    }
}

#[derive(Debug, Clone)]
pub struct Layer {
    app_state: AppState,
}

impl Layer {
    pub fn new(app_state: AppState) -> Self {
        Self { app_state }
    }
}

impl<S> tower::Layer<S> for Layer {
    type Service = Service<S>;

    fn layer(&self, inner: S) -> Self::Service {
        Service::new(inner, self.app_state.clone())
    }
}
