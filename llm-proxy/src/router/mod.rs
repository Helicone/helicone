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

pub type RouterService =
    ErrorHandler<request_context::Service<ProviderBalancer>>;

#[derive(Debug)]
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
            DeploymentTarget::Cloud { .. } | DeploymentTarget::Sidecar => {
                return Err(InitError::DeploymentTargetNotSupported(
                    app_state.0.config.deployment_target.clone(),
                ));
            }
            DeploymentTarget::SelfHosted => {
                let router_config = app_state
                    .0
                    .config
                    .routers
                    .as_ref()
                    .get(&id)
                    .ok_or(InitError::DefaultRouterNotFound)?
                    .clone();
                Arc::new(router_config)
            }
        };
        router_config.validate()?;
        let provider_keys = app_state
            .0
            .config
            .discover
            .provider_keys(&router_config.balance)?;
        let (balancer, monitor) =
            ProviderBalancer::new(app_state.clone(), router_config.clone())
                .await?;
        let service_stack: RouterService = ServiceBuilder::new()
            .layer(ErrorHandlerLayer::new(app_state.clone()))
            .layer(crate::middleware::request_context::Layer::new(
                router_config.clone(),
                // TODO: we can remove this
                provider_keys,
            ))
            // other middleware: rate limiting, logging, etc, etc
            // will be added here as well from the router config
            // .map_err(|e| crate::error::api::Error::Box(e))
            .service(balancer);

        tracing::info!(id = %id, "router created");

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

    #[inline]
    fn poll_ready(
        &mut self,
        ctx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(ctx)
    }

    #[inline]
    #[tracing::instrument(level = "debug", name = "router", skip_all)]
    fn call(&mut self, req: crate::types::request::Request) -> Self::Future {
        self.inner.call(req)
    }
}
