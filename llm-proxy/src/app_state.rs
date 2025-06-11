use std::sync::Arc;

use rustc_hash::FxHashMap as HashMap;
use tokio::sync::{
    Mutex, RwLock,
    mpsc::{Receiver, Sender},
};

use crate::{
    config::{
        Config, minio::Minio, rate_limit::RateLimiterConfig,
        response_headers::ResponseHeadersConfig,
    },
    control_plane::control_plane_state::ControlPlaneState,
    discover::monitor::{
        health::provider::HealthMonitorMap, metrics::EndpointMetricsRegistry,
        rate_limit::RateLimitMonitorMap,
    },
    error::init::InitError,
    logger::service::JawnClient,
    metrics::Metrics,
    types::{
        provider::ProviderKeys,
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
    pub control_plane_state: Arc<Mutex<ControlPlaneState>>,
    pub provider_keys: RwLock<HashMap<RouterId, ProviderKeys>>,
    pub global_rate_limit: Option<Arc<RateLimiterConfig>>,
    pub router_rate_limits: RwLock<HashMap<RouterId, Arc<RateLimiterConfig>>>,
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
        router_id: RouterId,
    ) -> Result<Sender<RateLimitEvent>, InitError> {
        let rate_limit_channels = self.0.rate_limit_senders.read().await;
        let rate_limit_tx = rate_limit_channels
            .get(&router_id)
            .ok_or(InitError::RateLimitChannelsNotInitialized(router_id))?;
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
}
