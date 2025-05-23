pub mod meta;

use std::{
    future::{Ready, ready},
    sync::Arc,
    task::{Context, Poll},
};

use futures::future::Either;
use http::uri::PathAndQuery;
use rustc_hash::FxHashMap as HashMap;
use tower::ServiceBuilder;

use crate::{
    app::AppState,
    balancer::provider::ProviderBalancer,
    config::{DeploymentTarget, router::RouterConfig},
    endpoints::{ApiEndpoint, EndpointType},
    error::{
        api::Error, init::InitError, internal::InternalError,
        invalid_req::InvalidRequestError,
    },
    middleware::request_context,
    types::router::RouterId,
};

pub type RouterService = request_context::Service<ProviderBalancer>;

#[derive(Debug)]
pub struct Router {
    inner: HashMap<EndpointType, RouterService>,
    _id: RouterId,
    router_config: Arc<RouterConfig>,
}

impl Router {
    pub async fn new(
        id: RouterId,
        app_state: AppState,
    ) -> Result<Self, InitError> {
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

        let mut inner = HashMap::default();
        for (endpoint_type, balance_config) in router_config.balance.as_ref() {
            let balancer = ProviderBalancer::new(
                app_state.clone(),
                id,
                router_config.clone(),
                balance_config,
            )
            .await?;
            let provider_keys = app_state
                .0
                .config
                .discover
                .provider_keys(&router_config.balance)?;
            let service_stack: RouterService = ServiceBuilder::new()
                .layer(request_context::Layer::new(
                    router_config.clone(),
                    provider_keys,
                ))
                // other middleware: rate limiting, caching, etc, etc
                // will be added here as well from the router config
                // .map_err(|e| crate::error::api::Error::Box(e))
                .service(balancer);

            inner.insert(*endpoint_type, service_stack);
        }

        tracing::info!(id = %id, "router created");

        Ok(Self {
            inner,
            _id: id,
            router_config,
        })
    }
}

impl tower::Service<crate::types::request::Request> for Router {
    type Response = crate::types::response::Response;
    type Error = Error;
    type Future = Either<
            Ready<Result<crate::types::response::Response, Error>>,
            <RouterService as tower::Service<crate::types::request::Request>>::Future,
        >;

    #[inline]
    fn poll_ready(
        &mut self,
        ctx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        let mut any_pending = false;
        for balancer in self.inner.values_mut() {
            if balancer.poll_ready(ctx).is_pending() {
                any_pending = true;
            }
        }
        if any_pending {
            Poll::Pending
        } else {
            Poll::Ready(Ok(()))
        }
    }

    #[inline]
    #[tracing::instrument(level = "debug", name = "router", skip_all)]
    fn call(&mut self, req: crate::types::request::Request) -> Self::Future {
        let router_config = self.router_config.clone();
        let Some(extracted_path_and_query) =
            req.extensions().get::<PathAndQuery>()
        else {
            return Either::Left(ready(Err(InternalError::ExtensionNotFound(
                "PathAndQuery",
            )
            .into())));
        };

        let endpoint_type = match ApiEndpoint::new(
            extracted_path_and_query.path(),
            router_config.request_style,
        ) {
            Ok(endpoint) => endpoint.endpoint_type(),
            Err(e) => {
                return Either::Left(ready(Err(e.into())));
            }
        };
        if let Some(balancer) = self.inner.get_mut(&endpoint_type) {
            return Either::Right(balancer.call(req));
        }
        Either::Left(ready(Err(InvalidRequestError::NotFound(
            extracted_path_and_query.path().to_string(),
        )
        .into())))
    }
}
