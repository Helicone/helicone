use std::{
    future::{Future, Ready, ready},
    pin::Pin,
    sync::Arc,
    task::{Context, Poll},
};

use http::uri::PathAndQuery;
use rustc_hash::FxHashMap as HashMap;
use tower::ServiceBuilder;

use crate::{
    app::AppState,
    balancer::provider::ProviderBalancer,
    config::{DeploymentTarget, router::RouterConfig},
    dispatcher::{Dispatcher, DispatcherService},
    endpoints::{ApiEndpoint, EndpointType},
    error::{
        api::ApiError, init::InitError, internal::InternalError,
        invalid_req::InvalidRequestError,
    },
    middleware::{rate_limit::service as rate_limit, request_context},
    types::{provider::ProviderKeys, router::RouterId},
};

pub type RouterService =
    rate_limit::Service<request_context::Service<ProviderBalancer>>;
pub type DirectProxyService =
    rate_limit::Service<request_context::Service<DispatcherService>>;

#[derive(Debug)]
pub struct Router {
    inner: HashMap<EndpointType, RouterService>,
    direct_proxy: DirectProxyService,
    router_config: Arc<RouterConfig>,
}

impl Router {
    pub async fn new(
        id: RouterId,
        app_state: AppState,
    ) -> Result<Self, InitError> {
        let router_config = match &app_state.0.config.deployment_target {
            DeploymentTarget::Cloud | DeploymentTarget::Sidecar => {
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

        let provider_keys =
            Self::add_provider_keys(id, &router_config, &app_state).await?;
        let mut inner = HashMap::default();
        let rl_layer =
            rate_limit::Layer::per_router(&app_state, id, &router_config)
                .await?;
        for (endpoint_type, balance_config) in router_config.balance.as_ref() {
            let balancer = ProviderBalancer::new(
                app_state.clone(),
                id,
                router_config.clone(),
                balance_config,
            )
            .await?;
            let service_stack: RouterService = ServiceBuilder::new()
                .layer(rl_layer.clone())
                .layer(request_context::Layer::new(
                    router_config.clone(),
                    provider_keys.clone(),
                ))
                // other middleware: caching, etc, etc
                // will be added here as well from the router config
                // .map_err(|e| crate::error::api::Error::Box(e))
                .service(balancer);

            inner.insert(*endpoint_type, service_stack);
        }
        let direct_proxy_dispatcher = Dispatcher::new(
            app_state.clone(),
            id,
            &router_config,
            router_config.request_style,
        )
        .await?;

        let direct_proxy = ServiceBuilder::new()
            .layer(rl_layer)
            .layer(request_context::Layer::new(
                router_config.clone(),
                provider_keys,
            ))
            // other middleware: caching, etc, etc
            // will be added here as well from the router config
            // .map_err(|e| crate::error::api::Error::Box(e))
            .service(direct_proxy_dispatcher);

        tracing::info!(id = %id, "router created");

        Ok(Self {
            inner,
            direct_proxy,
            router_config,
        })
    }

    async fn add_provider_keys(
        router_id: RouterId,
        router_config: &Arc<RouterConfig>,
        app_state: &AppState,
    ) -> Result<ProviderKeys, InitError> {
        // This should be the only place we call .provider_keys(), everywhere
        // else we should use the `router_id` to get the provider keys
        // from the app state
        let provider_keys =
            app_state.0.config.discover.provider_keys(router_config)?;
        let mut provider_keys_map = app_state.0.provider_keys.write().await;
        provider_keys_map.insert(router_id, provider_keys.clone());
        Ok(provider_keys)
    }
}

impl tower::Service<crate::types::request::Request> for Router {
    type Response = crate::types::response::Response;
    type Error = ApiError;
    type Future = RouterFuture;

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
    fn call(
        &mut self,
        mut req: crate::types::request::Request,
    ) -> Self::Future {
        let router_config = self.router_config.clone();
        let Some(extracted_path_and_query) =
            req.extensions().get::<PathAndQuery>()
        else {
            return RouterFuture::Ready(ready(Err(
                InternalError::ExtensionNotFound("PathAndQuery").into(),
            )));
        };

        let api_endpoint = ApiEndpoint::new(
            extracted_path_and_query.path(),
            router_config.request_style,
        );
        match api_endpoint {
            Some(api_endpoint) => {
                let endpoint_type = api_endpoint.endpoint_type();
                if let Some(balancer) = self.inner.get_mut(&endpoint_type) {
                    req.extensions_mut().insert(api_endpoint);
                    RouterFuture::Balancer(balancer.call(req))
                } else {
                    RouterFuture::Ready(ready(Err(
                        InvalidRequestError::NotFound(
                            extracted_path_and_query.path().to_string(),
                        )
                        .into(),
                    )))
                }
            }
            None => RouterFuture::DirectProxy(self.direct_proxy.call(req)),
        }
    }
}

pub enum RouterFuture {
    /// Ready with an immediate response
    Ready(Ready<Result<crate::types::response::Response, ApiError>>),
    /// Calling the `ProviderBalancer`
    Balancer(<RouterService as tower::Service<crate::types::request::Request>>::Future),
    /// Calling the direct proxy
    DirectProxy(<DirectProxyService as tower::Service<crate::types::request::Request>>::Future),
}

impl Future for RouterFuture {
    type Output = Result<crate::types::response::Response, ApiError>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        match self.get_mut() {
            RouterFuture::Ready(ready) => Pin::new(ready).poll(cx),
            RouterFuture::Balancer(fut) => Pin::new(fut).poll(cx),
            RouterFuture::DirectProxy(fut) => {
                match Pin::new(fut).poll(cx) {
                    Poll::Ready(Ok(response)) => Poll::Ready(Ok(response)),
                    Poll::Ready(Err(infallible)) => {
                        // This match confirms the error is truly infallible
                        match infallible {}
                    }
                    Poll::Pending => Poll::Pending,
                }
            }
        }
    }
}
