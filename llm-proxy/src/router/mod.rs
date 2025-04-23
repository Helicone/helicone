pub mod meta;

use std::{
    convert::Infallible,
    sync::Arc,
    task::{Context, Poll},
};

use tower::ServiceBuilder;

use crate::{
    app::AppState,
    balancer::provider::ProviderBalancer,
    config::{DeploymentTarget, router::RouterConfig},
    discover::provider::monitor::ProviderMonitor,
    error::init::InitError,
    middleware::request_context,
    types::router::RouterId,
    utils::handle_error::{ErrorHandler, ErrorHandlerLayer},
};

pub type RouterService = ErrorHandler<
    request_context::Service<ProviderBalancer, axum_core::body::Body>,
>;

#[derive(Debug, Clone)]
pub struct Router {
    inner: RouterService,
    _id: RouterId,
    _router_config: Arc<RouterConfig>,
}

impl Router {
    pub async fn new(
        id: RouterId,
        app_state: AppState,
    ) -> Result<(Self, ProviderMonitor), InitError> {
        let router_config = match &app_state.0.config.deployment_target {
            DeploymentTarget::Cloud | DeploymentTarget::SelfHosted => {
                return Err(InitError::DeploymentTargetNotSupported(
                    app_state.0.config.deployment_target,
                ));
            }
            DeploymentTarget::Sidecar => {
                let router_config = app_state
                    .0
                    .config
                    .routers
                    .as_ref()
                    .get(&RouterId::Default)
                    .ok_or(InitError::DefaultRouterNotFound)?
                    .clone();
                Arc::new(router_config)
            }
        };
        // TODO: how to get provider keys via discovery instead of above^
        let (balancer, monitor) = ProviderBalancer::new(app_state.clone()).await?;
        let service_stack: RouterService = ServiceBuilder::new()
            .layer(ErrorHandlerLayer)
            .layer(crate::middleware::request_context::Layer::<
                axum_core::body::Body,
            >::new(
                app_state.clone(),
                router_config.clone(),
                app_state.0.provider_keys.clone(),
            ))
            // other middleware: rate limiting, logging, etc, etc
            // will be added here as well from the router config
            // .map_err(|e| crate::error::api::Error::Box(e))
            .service(balancer);

        tracing::trace!(id = %id, "router created");

        Ok((
            Self {
                inner: service_stack,
                _id: id,
                _router_config: router_config,
            },
            monitor,
        ))
    }
}

impl tower::Service<crate::types::request::Request> for Router {
    type Response = crate::types::response::Response;
    type Error = Infallible;
    type Future = <RouterService as tower::Service<
        crate::types::request::Request,
    >>::Future;

    fn poll_ready(
        &mut self,
        ctx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(ctx)
    }

    fn call(&mut self, req: crate::types::request::Request) -> Self::Future {
        self.inner.call(req)
    }
}
