use std::sync::Arc;

use rustc_hash::FxHashMap as HashMap;
use tokio::sync::{
    RwLock,
    mpsc::{Receiver, Sender},
};

use crate::{
    config::{
        Config, minio::Minio, rate_limit::RateLimiterConfig,
        response_headers::ResponseHeadersConfig, router::RouterConfig,
    },
    control_plane::control_plane_state::ControlPlaneState,
    discover::monitor::{
        health::provider::HealthMonitorMap, metrics::EndpointMetricsRegistry,
        rate_limit::RateLimitMonitorMap,
    },
    error::{init::InitError, provider::ProviderError},
    logger::service::JawnClient,
    metrics::Metrics,
    types::{
        provider::{InferenceProvider, ProviderKey, ProviderKeys},
        rate_limit::{
            RateLimitEvent, RateLimitEventReceivers, RateLimitEventSenders,
        },
        router::RouterId,
    },
};

#[derive(Debug, Clone)]
pub struct AppState(pub Arc<InnerAppState>);

impl AppState {
    #[must_use]
    pub fn response_headers_config(&self) -> ResponseHeadersConfig {
        self.0.config.response_headers
    }

    #[must_use]
    pub fn config(&self) -> &Config {
        &self.0.config
    }
}

#[derive(Debug)]
pub struct InnerAppState {
    pub config: Config,
    pub minio: Minio,
    pub jawn_http_client: JawnClient,
    pub control_plane_state: Arc<RwLock<ControlPlaneState>>,
    pub provider_keys: RwLock<HashMap<RouterId, ProviderKeys>>,
    pub global_rate_limit: Option<Arc<RateLimiterConfig>>,
    pub unified_api_rate_limit: Option<Arc<RateLimiterConfig>>,
    pub router_rate_limits: RwLock<HashMap<RouterId, Arc<RateLimiterConfig>>>,
    pub direct_proxy_api_keys: ProviderKeys,
    /// Top level metrics which are exported to OpenTelemetry.
    pub metrics: Metrics,
    /// Metrics to track provider health and rate limits.
    /// Not used for OpenTelemetry, only used for the load balancer to be
    /// dynamically updated based on provider health and rate limits.
    pub endpoint_metrics: EndpointMetricsRegistry,
    pub health_monitors: HealthMonitorMap,
    pub rate_limit_monitors: RateLimitMonitorMap,
    pub rate_limit_senders: RateLimitEventSenders,
    pub rate_limit_receivers: RateLimitEventReceivers,
}

impl AppState {
    pub async fn get_rate_limit_tx(
        &self,
        router_id: &RouterId,
    ) -> Result<Sender<RateLimitEvent>, InitError> {
        let rate_limit_channels = self.0.rate_limit_senders.read().await;
        let rate_limit_tx =
            rate_limit_channels.get(router_id).ok_or_else(|| {
                InitError::RateLimitChannelsNotInitialized(router_id.clone())
            })?;
        Ok(rate_limit_tx.clone())
    }

    pub async fn add_rate_limit_tx(
        &self,
        router_id: RouterId,
        rate_limit_tx: Sender<RateLimitEvent>,
    ) {
        let mut rate_limit_channels = self.0.rate_limit_senders.write().await;
        rate_limit_channels.insert(router_id, rate_limit_tx);
    }

    pub async fn add_rate_limit_rx(
        &self,
        router_id: RouterId,
        rate_limit_rx: Receiver<RateLimitEvent>,
    ) {
        let mut rate_limit_channels = self.0.rate_limit_receivers.write().await;
        rate_limit_channels.insert(router_id, rate_limit_rx);
    }

    pub async fn add_provider_keys_for_router(
        &self,
        router_id: RouterId,
        router_config: &Arc<RouterConfig>,
    ) -> Result<ProviderKeys, InitError> {
        // This should be the only place we call .provider_keys(), everywhere
        // else we should use the `router_id` to get the provider keys
        // from the app state
        let provider_keys = self
            .0
            .config
            .discover
            .provider_keys(router_config)
            .inspect_err(|e| {
                tracing::error!(
                    error = %e,
                    "Error getting provider keys for router"
                );
            })?;
        let mut provider_keys_map = self.0.provider_keys.write().await;
        provider_keys_map.insert(router_id, provider_keys.clone());
        Ok(provider_keys)
    }

    pub async fn get_provider_api_key_for_router(
        &self,
        router_id: &RouterId,
        provider: InferenceProvider,
    ) -> Result<ProviderKey, ProviderError> {
        let provider_keys = self.0.provider_keys.read().await;
        let provider_keys = provider_keys.get(router_id).ok_or_else(|| {
            ProviderError::ProviderKeysNotFound(router_id.clone())
        })?;
        let key = provider_keys
            .get(&provider)
            .ok_or_else(|| ProviderError::ApiKeyNotFound(provider))
            .inspect_err(|e| {
                tracing::error!(
                    error = %e,
                    "Error getting provider key for router"
                );
            })?
            .clone();
        Ok(key)
    }

    pub fn get_provider_api_key_for_direct_proxy(
        &self,
        provider: InferenceProvider,
    ) -> Result<ProviderKey, ProviderError> {
        let key = self
            .0
            .direct_proxy_api_keys
            .get(&provider)
            .ok_or_else(|| ProviderError::ApiKeyNotFound(provider))
            .inspect_err(|e| {
                tracing::error!(
                    error = %e,
                    "Error getting provider key for direct proxy"
                );
            })?
            .clone();
        Ok(key)
    }
}
