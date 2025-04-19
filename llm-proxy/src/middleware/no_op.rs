use std::{
    marker::PhantomData,
    task::{Context, Poll},
};

use futures::future::BoxFuture;
use http::Request;

use crate::{app::AppState, error::api::Error};

#[derive(Debug)]
pub struct Service<S, ReqBody> {
    inner: S,
    app_state: AppState,
    _marker: PhantomData<ReqBody>,
}

/// A manual impl of Clone since the derived version will add a Clone bound on
/// the ReqBody type, which isn't needed since it's just used as a marker type.
impl<S, ReqBody> Clone for Service<S, ReqBody>
where
    S: Clone,
{
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
            app_state: self.app_state.clone(),
            _marker: PhantomData,
        }
    }
}

impl<S, ReqBody> Service<S, ReqBody> {
    pub fn new(inner: S, app_state: AppState) -> Self {
        Self {
            inner,
            app_state,
            _marker: PhantomData,
        }
    }
}

impl<S, ReqBody> tower::Service<Request<ReqBody>> for Service<S, ReqBody>
where
    S: tower::Service<Request<ReqBody>> + Clone + Send + Sync + 'static,
    S::Future: Send + 'static,
    S::Response: Send + 'static,
    S::Error: Into<Error> + Send + Sync + 'static,
    ReqBody: Send + Sync + 'static,
{
    type Response = S::Response;
    type Error = Error;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx).map_err(Into::into)
    }

    #[tracing::instrument(name = "NoOpService::call", skip(self, req))]
    fn call(&mut self, req: Request<ReqBody>) -> Self::Future {
        tracing::info!("NoOpService::call");
        let mut this = self.clone();
        Box::pin(async move { this.inner.call(req).await.map_err(Into::into) })
    }
}

#[derive(Debug, Clone)]
pub struct Layer<ReqBody> {
    app_state: AppState,
    _marker: PhantomData<ReqBody>,
}

impl<ReqBody> Layer<ReqBody> {
    pub fn new(app_state: AppState) -> Self {
        Self {
            app_state,
            _marker: PhantomData,
        }
    }
}

impl<S, ReqBody> tower::Layer<S> for Layer<ReqBody> {
    type Service = Service<S, ReqBody>;

    fn layer(&self, inner: S) -> Self::Service {
        Service::new(inner, self.app_state.clone())
    }
}
