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
    config::{router::RouterConfig, server::DeploymentTarget},
    discover::provider::monitor::ProviderMonitor,
    error::init::InitError,
    middleware::request_context,
    types::router::RouterId,
    utils::handle_error::{ErrorHandler, ErrorHandlerLayer},
};

pub type RouterService = ErrorHandler<
    request_context::Service<ProviderBalancer, axum_core::body::Body>,
>;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RouterConfigSource {
    Database,
    #[allow(dead_code)]
    Helicone,
    ConfigFile,
}

impl From<&DeploymentTarget> for RouterConfigSource {
    fn from(value: &DeploymentTarget) -> Self {
        match value {
            DeploymentTarget::Cloud | DeploymentTarget::SelfHosted => {
                Self::Database
            }
            DeploymentTarget::Sidecar => Self::ConfigFile,
        }
    }
}

#[derive(Debug, Clone)]
pub struct Router {
    inner: RouterService,
    _id: RouterId,
    _router_config: Arc<RouterConfig>,
}

impl Router {
    pub fn new(
        id: RouterId,
        app_state: AppState,
    ) -> Result<(Self, ProviderMonitor), InitError> {
        let source = RouterConfigSource::from(
            &app_state.0.config.server.deployment_target,
        );
        let router_config = match source {
            RouterConfigSource::Database | RouterConfigSource::Helicone => {
                return Err(InitError::DeploymentTargetNotSupported(
                    app_state.0.config.server.deployment_target,
                ));
            }
            RouterConfigSource::ConfigFile => {
                let default_router_config = app_state
                    .0
                    .config
                    .routers
                    .as_ref()
                    .get(&RouterId::Default)
                    .ok_or(InitError::DefaultRouterNotFound)?
                    .clone();
                Arc::new(default_router_config)
            }
        };

        let (balancer, monitor) = ProviderBalancer::new(app_state.clone());
        let service_stack: RouterService = ServiceBuilder::new()
            .layer(ErrorHandlerLayer)
            .layer(crate::middleware::request_context::Layer::<
                axum_core::body::Body,
            >::new(app_state.clone(), router_config.clone()))
            // other middleware: rate limiting, logging, etc, etc
            // will be added here as well from the router config
            // .map_err(|e| crate::error::api::Error::Box(e))
            .service(balancer);

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
