use std::{
    collections::HashMap,
    pin::Pin,
    sync::Arc,
    task::{Context, Poll},
};

use futures::future::{Ready, ready};
use pin_project::pin_project;
use tower::BoxError;

use crate::{
    app::AppState,
    balancer::provider::ProviderBalancer,
    discover::ProviderDiscovery,
    error::internal::InternalError,
    types::{
        model::Model,
        request::{Request, RequestContext},
        response::Response,
    },
};

#[derive(Debug)]
pub struct ModelRouter {
    inner: HashMap<Model, ProviderBalancer>,
}

#[pin_project(project = ModelRouterFutProj)]
pub enum ModelRouterFuture {
    Balanced(#[pin] <ProviderBalancer as tower::Service<Request>>::Future),
    Error(#[pin] Ready<Result<Response, BoxError>>),
}

impl std::future::Future for ModelRouterFuture {
    type Output = Result<Response, BoxError>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        match self.project() {
            ModelRouterFutProj::Balanced(fut) => fut.poll(cx),
            ModelRouterFutProj::Error(fut) => fut.poll(cx),
        }
    }
}

impl ModelRouter {
    pub fn new(app: AppState) -> Self {
        let mut inner: HashMap<Model, ProviderBalancer> = HashMap::new();

        // Iterate over provider -> [models] mapping from config and build
        // per‑model balancers
        for (_provider, models) in &app.0.config.discover.models.0 {
            for model in models {
                // Each balancer gets its own change channel (for now unused)
                let rx = app
                    .0
                    .broadcasts
                    .rx
                    .get(model)
                    .expect("always valid if tests pass")
                    .resubscribe();
                let discovery =
                    ProviderDiscovery::config(app.clone(), model.clone(), rx);

                let balancer = ProviderBalancer::new(discovery);
                inner.insert(model.clone(), balancer);
            }
        }

        Self { inner }
    }
}

impl tower::Service<Request> for ModelRouter {
    type Response = Response;
    type Error = BoxError;
    type Future = ModelRouterFuture;

    fn poll_ready(
        &mut self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        for balancer in self.inner.values_mut() {
            match balancer.poll_ready(cx) {
                Poll::Ready(Ok(())) => {}
                Poll::Ready(Err(e)) => return Poll::Ready(Err(e)),
                Poll::Pending => return Poll::Pending,
            }
        }
        Poll::Ready(Ok(()))
    }

    fn call(&mut self, req: Request) -> Self::Future {
        if let Some(req_ctx) = req.extensions().get::<Arc<RequestContext>>() {
            let model = &req_ctx.proxy_context.target_model;
            // do we need a ready cache?
            if let Some(balancer) = self.inner.get_mut(model) {
                let fut = balancer.call(req);
                ModelRouterFuture::Balanced(fut)
            } else {
                ModelRouterFuture::Error(ready(Err(
                    InternalError::ProviderNotFound.into(),
                )))
            }
        } else {
            ModelRouterFuture::Error(ready(Err(
                InternalError::ExtensionNotFound("RequestContext").into(),
            )))
        }
    }
}
