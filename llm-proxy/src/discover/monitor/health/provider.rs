//! Dynamically remove inference providers that fail health checks
use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
    time::Duration,
};

use futures::future::{self, BoxFuture};
use meltdown::Token;
use rust_decimal::prelude::ToPrimitive;
use tokio::{
    sync::{RwLock, mpsc::Sender},
    time,
};
use tower::discover::Change;
use tracing::{Instrument, error, info, trace, warn};
use weighted_balance::weight::Weight;

use crate::{
    app::AppState,
    config::{
        balance::BalanceConfigInner,
        monitor::{GracePeriod, MonitorConfig},
        router::RouterConfig,
    },
    discover::{provider::Key, weighted::WeightedKey},
    dispatcher::{Dispatcher, DispatcherService},
    error::{
        init::InitError,
        internal::InternalError,
        provider::ProviderError,
        runtime::{self, RuntimeError},
    },
    types::{provider::InferenceProvider, router::RouterId},
};

const DEFAULT_ERROR_THRESHOLD: f64 = 0.15;

pub type HealthMonitorMap =
    Arc<RwLock<HashMap<RouterId, ProviderHealthMonitor>>>;

#[derive(Debug, Clone)]
pub enum ProviderHealthMonitor {
    Weighted(ProviderMonitorInner<WeightedKey>),
    P2C(ProviderMonitorInner<Key>),
}

impl ProviderHealthMonitor {
    fn weighted(
        tx: Sender<Change<WeightedKey, DispatcherService>>,
        router_config: Arc<RouterConfig>,
        app_state: AppState,
    ) -> Self {
        Self::Weighted(ProviderMonitorInner::new(tx, router_config, app_state))
    }

    fn p2c(
        tx: Sender<Change<Key, DispatcherService>>,
        router_config: Arc<RouterConfig>,
        app_state: AppState,
    ) -> Self {
        Self::P2C(ProviderMonitorInner::new(tx, router_config, app_state))
    }

    async fn check_monitor(&mut self) -> Result<(), runtime::RuntimeError> {
        match self {
            ProviderHealthMonitor::Weighted(inner) => {
                check_weighted_monitor(inner).await
            }
            ProviderHealthMonitor::P2C(inner) => check_p2c_monitor(inner).await,
        }
    }
}

async fn check_weighted_monitor(
    inner: &mut ProviderMonitorInner<WeightedKey>,
) -> Result<(), runtime::RuntimeError> {
    for (endpoint_type, balance_config) in inner.router_config.balance.as_ref()
    {
        match balance_config {
            BalanceConfigInner::Weighted { targets } => {
                for target in targets {
                    let provider = target.provider;
                    let weight =
                        Weight::from(target.weight.to_f64().ok_or(
                            InitError::InvalidWeight(target.provider),
                        )?);

                    let key =
                        WeightedKey::new(provider, *endpoint_type, weight);
                    let is_healthy = inner.check_health(provider)?;
                    let was_unhealthy = inner.unhealthy_keys.contains(&key);

                    if !is_healthy && !was_unhealthy {
                        trace!(provider = ?provider, endpoint_type = ?endpoint_type, "Provider became unhealthy, removing");
                        if let Err(e) = inner.tx.send(Change::Remove(key)).await
                        {
                            warn!(error = ?e, "Failed to send remove event for unhealthy provider");
                        }
                        inner.unhealthy_keys.insert(key);
                    } else if is_healthy && was_unhealthy {
                        trace!(provider = ?provider, endpoint_type = ?endpoint_type, "Provider became healthy, adding back");
                        inner.unhealthy_keys.remove(&key);

                        let service = inner.create_service(provider)?;
                        if let Err(e) =
                            inner.tx.send(Change::Insert(key, service)).await
                        {
                            warn!(error = ?e, "Failed to send insert event for healthy provider");
                        }
                    }
                }
            }
            BalanceConfigInner::P2C { .. } => {
                tracing::error!("P2C entries in a weighted monitor");
                return Err(InternalError::Internal.into());
            }
        }
    }

    Ok(())
}

async fn check_p2c_monitor(
    inner: &mut ProviderMonitorInner<Key>,
) -> Result<(), runtime::RuntimeError> {
    for (endpoint_type, balance_config) in inner.router_config.balance.as_ref()
    {
        match balance_config {
            BalanceConfigInner::P2C { targets } => {
                for &provider in targets {
                    let key = Key::new(provider, *endpoint_type);
                    let is_healthy = inner.check_health(provider)?;
                    let was_unhealthy = inner.unhealthy_keys.contains(&key);

                    if !is_healthy && !was_unhealthy {
                        trace!(provider = ?provider, endpoint_type = ?endpoint_type, "Provider became unhealthy, removing");
                        if let Err(e) = inner.tx.send(Change::Remove(key)).await
                        {
                            warn!(error = ?e, "Failed to send remove event for unhealthy provider");
                        }
                        inner.unhealthy_keys.insert(key);
                    } else if is_healthy && was_unhealthy {
                        trace!(provider = ?provider, endpoint_type = ?endpoint_type, "Provider became healthy, adding back");
                        inner.unhealthy_keys.remove(&key);

                        let service = inner.create_service(provider)?;
                        if let Err(e) =
                            inner.tx.send(Change::Insert(key, service)).await
                        {
                            warn!(error = ?e, "Failed to send insert event for healthy provider");
                        }
                    }
                }
            }
            BalanceConfigInner::Weighted { .. } => {
                tracing::error!("Weighted entries in a P2C monitor");
                return Err(InternalError::Internal.into());
            }
        }
    }

    Ok(())
}

/// Monitors health of provider APIs and emits Change events when providers
/// become unhealthy
#[derive(Debug, Clone)]
pub struct ProviderMonitorInner<K> {
    tx: Sender<Change<K, DispatcherService>>,
    router_config: Arc<RouterConfig>,
    app_state: AppState,
    unhealthy_keys: HashSet<K>,
}

impl<K> ProviderMonitorInner<K> {
    fn new(
        tx: Sender<Change<K, DispatcherService>>,
        router_config: Arc<RouterConfig>,
        app_state: AppState,
    ) -> Self {
        Self {
            tx,
            router_config,
            app_state,
            unhealthy_keys: HashSet::new(),
        }
    }

    fn error_threshold(&self) -> f64 {
        match self.app_state.0.config.discover.monitor {
            MonitorConfig::ErrorRatio { ratio, .. } => {
                ratio.to_f64().unwrap_or(DEFAULT_ERROR_THRESHOLD)
            }
        }
    }

    fn grace_period(&self) -> &GracePeriod {
        match &self.app_state.0.config.discover.monitor {
            MonitorConfig::ErrorRatio { grace_period, .. } => grace_period,
        }
    }

    fn check_health(
        &self,
        provider: InferenceProvider,
    ) -> Result<bool, InternalError> {
        let provider_endpoints = provider.endpoints();
        let grace_period = self.grace_period();
        let mut all_healthy = true;
        for endpoint in provider_endpoints {
            let endpoint_metrics = self
                .app_state
                .0
                .endpoint_metrics
                .endpoint_metrics(endpoint)?;
            let requests = endpoint_metrics.request_count.total();
            match grace_period {
                GracePeriod::Requests { min_requests } => {
                    if requests < *min_requests {
                        trace!(
                            provider = ?provider,
                            endpoint = ?endpoint,
                            "Not enough requests to check health, skipping"
                        );
                        continue;
                    }
                }
            }

            let errors = endpoint_metrics.remote_internal_error_count.total();
            let error_ratio = f64::from(errors) / f64::from(requests);

            if error_ratio > self.error_threshold() {
                all_healthy = false;
            }
        }

        Ok(all_healthy)
    }

    fn create_service(
        &self,
        provider: InferenceProvider,
    ) -> Result<DispatcherService, InitError> {
        let provider_keys = self
            .app_state
            .0
            .config
            .discover
            .provider_keys(&self.router_config.balance)?;

        let api_key = provider_keys
            .as_ref()
            .as_ref()
            .get(&provider)
            .ok_or(ProviderError::ApiKeyNotFound(provider))?
            .clone();

        Dispatcher::new(
            self.app_state.clone(),
            &self.router_config,
            provider,
            &api_key,
        )
    }
}

#[derive(Debug, Clone)]
pub struct HealthMonitor {
    app_state: AppState,
}

impl HealthMonitor {
    #[must_use]
    pub fn new(app_state: AppState) -> Self {
        Self { app_state }
    }

    pub async fn run_forever(self) -> Result<(), runtime::RuntimeError> {
        info!("Starting provider monitors");

        let interval_duration = self.interval();
        let mut interval = time::interval(interval_duration);

        loop {
            trace!("Checking provider monitors");
            interval.tick().await;
            let mut monitors = self.app_state.0.health_monitor.write().await;
            let mut check_futures = Vec::new();
            for (router_id, monitor) in monitors.iter_mut() {
                let span = tracing::info_span!("provider_monitor", router_id = ?router_id);
                let router_id = *router_id;
                let check_future = async move {
                    let result = monitor.check_monitor().await;
                    if let Err(e) = &result {
                        error!(router_id = ?router_id, error = ?e, "Provider monitor check failed");
                    }
                    result
                }.instrument(span);

                check_futures.push(check_future);
            }

            if let Err(e) = future::try_join_all(check_futures).await {
                error!(error = ?e, "Provider monitor encountered an error");
                return Err(e);
            }
        }
    }

    fn interval(&self) -> Duration {
        match self.app_state.0.config.discover.monitor {
            MonitorConfig::ErrorRatio { interval, .. } => interval,
        }
    }
}

impl meltdown::Service for HealthMonitor {
    type Future = BoxFuture<'static, Result<(), RuntimeError>>;

    fn run(self, mut token: Token) -> Self::Future {
        Box::pin(async move {
            tokio::select! {
                result = self.run_forever() => {
                    if let Err(e) = result {
                        error!(name = "provider-health-monitor-task", error = ?e, "Monitor encountered error, shutting down");
                    } else {
                        info!(name = "provider-health-monitor-task", "Monitor shut down successfully");
                    }
                    token.trigger();
                }
                () = &mut token => {
                    info!(name = "provider-health-monitor-task", "task shut down successfully");
                }
            }
            Ok(())
        })
    }
}

impl AppState {
    pub async fn add_weighted_router_health_monitor(
        &self,
        router_id: RouterId,
        router_config: Arc<RouterConfig>,
        tx: Sender<Change<WeightedKey, DispatcherService>>,
    ) {
        self.0.health_monitor.write().await.insert(
            router_id,
            ProviderHealthMonitor::weighted(tx, router_config, self.clone()),
        );
    }

    pub async fn add_p2c_router_health_monitor(
        &self,
        router_id: RouterId,
        router_config: Arc<RouterConfig>,
        tx: Sender<Change<Key, DispatcherService>>,
    ) {
        self.0.health_monitor.write().await.insert(
            router_id,
            ProviderHealthMonitor::p2c(tx, router_config, self.clone()),
        );
    }
}
