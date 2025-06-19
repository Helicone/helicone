use std::sync::Arc;

use rustc_hash::FxHashMap as HashMap;
use tower::ServiceBuilder;

use crate::{
    app_state::AppState,
    dispatcher::{
        Dispatcher, DispatcherService, service::DispatcherServiceWithoutMapper,
    },
    error::init::InitError,
    middleware::{
        cache::{CacheLayer, CacheService},
        rate_limit, request_context,
    },
    types::provider::InferenceProvider,
};

pub type DirectProxyService = rate_limit::Service<
    CacheService<request_context::Service<DispatcherService>>,
>;
pub type DirectProxyServiceWithoutMapper = rate_limit::Service<
    CacheService<request_context::Service<DispatcherServiceWithoutMapper>>,
>;

#[derive(Debug, Clone)]
pub struct DirectProxies(Arc<HashMap<InferenceProvider, DirectProxyService>>);

impl DirectProxies {
    pub fn new(app_state: &AppState) -> Result<Self, InitError> {
        let mut direct_proxies = HashMap::default();
        let provider_keys = app_state.0.direct_proxy_api_keys.clone();
        for (provider, _provider_config) in app_state
            .config()
            .providers
            .iter()
            .filter(|(_, config)| config.enabled)
        {
            let direct_proxy_dispatcher =
                Dispatcher::new_direct_proxy(app_state.clone(), *provider)?;

            let direct_proxy = ServiceBuilder::new()
                // TODO: should we change how global configs work for rate
                // limiting, caching?       For now, leave these
                // types here to make it easier to change later on.
                .layer(rate_limit::Layer::disabled())
                .layer(CacheLayer::disabled())
                .layer(request_context::Layer::for_direct_proxy(
                    provider_keys.clone(),
                ))
                // other middleware: caching, etc, etc
                // will be added here as well from the router config
                // .map_err(|e| crate::error::api::Error::Box(e))
                .service(direct_proxy_dispatcher);

            direct_proxies.insert(*provider, direct_proxy);
        }
        Ok(Self(Arc::new(direct_proxies)))
    }
}

impl std::ops::Deref for DirectProxies {
    type Target = Arc<HashMap<InferenceProvider, DirectProxyService>>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[derive(Debug, Clone)]
pub struct DirectProxiesWithoutMapper(
    Arc<HashMap<InferenceProvider, DirectProxyServiceWithoutMapper>>,
);

impl DirectProxiesWithoutMapper {
    pub fn new(app_state: &AppState) -> Result<Self, InitError> {
        let mut direct_proxies = HashMap::default();
        let provider_keys = app_state.0.direct_proxy_api_keys.clone();
        for (provider, _provider_config) in app_state
            .config()
            .providers
            .iter()
            .filter(|(_, config)| config.enabled)
        {
            let direct_proxy_dispatcher =
                Dispatcher::new_without_mapper(app_state.clone(), *provider)?;

            let direct_proxy = ServiceBuilder::new()
                // TODO: should we change how global configs work for rate
                // limiting, caching?       For now, leave these
                // types here to make it easier to change later on.
                .layer(rate_limit::Layer::disabled())
                .layer(CacheLayer::disabled())
                .layer(request_context::Layer::for_direct_proxy(
                    provider_keys.clone(),
                ))
                // other middleware: caching, etc, etc
                // will be added here as well from the router config
                // .map_err(|e| crate::error::api::Error::Box(e))
                .service(direct_proxy_dispatcher);

            direct_proxies.insert(*provider, direct_proxy);
        }
        Ok(Self(Arc::new(direct_proxies)))
    }
}

impl std::ops::Deref for DirectProxiesWithoutMapper {
    type Target =
        Arc<HashMap<InferenceProvider, DirectProxyServiceWithoutMapper>>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
