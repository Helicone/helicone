use std::{
    convert::Infallible,
    future::Future,
    pin::Pin,
    task::{Context, Poll},
};

use crate::{
    app_state::AppState,
    error::{api::ApiError, init::InitError, internal::InternalError},
    middleware::cache::service::{CacheLayer, CacheService},
    types::{request::Request, response::Response, router::RouterId},
};

#[derive(Debug, Clone)]
pub struct Layer {
    inner: Option<CacheLayer>,
}

impl Layer {
    pub fn for_router(
        app_state: &AppState,
        router_id: &RouterId,
    ) -> Result<Self, InitError> {
        let config = app_state.config();
        let router_config = config
            .routers
            .get(router_id)
            .ok_or(InitError::InvalidRouterId(router_id.to_string()))?;
        let layer = CacheLayer::for_router(app_state.clone(), router_config);
        Ok(Self { inner: layer })
    }

    #[must_use]
    pub fn global(app_state: &AppState) -> Self {
        let layer = CacheLayer::global(app_state);
        Self { inner: layer }
    }

    /// For when we statically know that caching is disabled.
    #[must_use]
    pub fn disabled() -> Self {
        Self { inner: None }
    }
}

impl<S> tower::Layer<S> for Layer {
    type Service = Service<S>;

    fn layer(&self, service: S) -> Self::Service {
        if let Some(inner) = &self.inner {
            Service::Enabled {
                service: inner.layer(service),
            }
        } else {
            Service::Disabled { service }
        }
    }
}

#[derive(Debug, Clone)]
pub enum Service<S> {
    Enabled { service: CacheService<S> },
    Disabled { service: S },
}

pin_project_lite::pin_project! {
    #[derive(Debug)]
    #[project = EnumProj]
    pub enum ResponseFuture<EnabledFuture, DisabledFuture> {
        Enabled { #[pin] future: EnabledFuture },
        Disabled { #[pin] future: DisabledFuture },
    }
}

impl<EnabledFuture, DisabledFuture, Response> Future
    for ResponseFuture<EnabledFuture, DisabledFuture>
where
    EnabledFuture: Future<Output = Result<Response, ApiError>>,
    DisabledFuture: Future<Output = Result<Response, Infallible>>,
{
    type Output = Result<Response, ApiError>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        match self.project() {
            EnumProj::Enabled { future } => future.poll(cx),
            EnumProj::Disabled { future } => future
                .poll(cx)
                .map_err(|_| ApiError::Internal(InternalError::Internal)),
        }
    }
}

impl<S> tower::Service<Request> for Service<S>
where
    S: tower::Service<Request, Response = Response, Error = Infallible>
        + Send
        + Clone
        + 'static,
    S::Future: Send + 'static,
{
    type Response = Response;
    type Error = ApiError;
    type Future = ResponseFuture<
        <CacheService<S> as tower::Service<Request>>::Future,
        S::Future,
    >;

    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        match self {
            Service::Enabled { service, .. } => service.poll_ready(cx),
            Service::Disabled { service } => service
                .poll_ready(cx)
                .map_err(|_| ApiError::Internal(InternalError::Internal)),
        }
    }

    fn call(&mut self, req: Request) -> Self::Future {
        match self {
            Service::Enabled { service } => ResponseFuture::Enabled {
                future: service.call(req),
            },
            Service::Disabled { service } => ResponseFuture::Disabled {
                future: service.call(req),
            },
        }
    }
}
