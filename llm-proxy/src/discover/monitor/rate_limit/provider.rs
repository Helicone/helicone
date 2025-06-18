//! Dynamically remove inference providers that are rate limited
use std::{
    sync::Arc,
    time::{Duration, Instant},
};

use futures::{StreamExt, future::BoxFuture, stream::FuturesUnordered};
use meltdown::Token;
use rust_decimal::prelude::ToPrimitive;
use rustc_hash::{FxHashMap as HashMap, FxHashSet as HashSet};
use tokio::{
    sync::{
        RwLock,
        mpsc::{Receiver, Sender},
    },
    task::JoinSet,
    time,
};
use tower::discover::Change;
use tracing::{debug, error, info, warn};
use weighted_balance::weight::Weight;

use crate::{
    app_state::AppState,
    config::{balance::BalanceConfigInner, router::RouterConfig},
    discover::{provider::Key, weighted::WeightedKey},
    dispatcher::{Dispatcher, DispatcherService},
    endpoints::ApiEndpoint,
    error::{init::InitError, internal::InternalError, runtime::RuntimeError},
    types::{
        rate_limit::{ProviderRestore, RateLimitEvent},
        router::RouterId,
    },
};

const DEFAULT_WAIT_SECONDS: u64 = 30;
#[cfg(not(any(feature = "testing", test)))]
const RATE_LIMIT_BUFFER_SECONDS: Duration = Duration::from_secs(30);
#[cfg(any(feature = "testing", test))]
const RATE_LIMIT_BUFFER_SECONDS: Duration = Duration::from_secs(1);

#[cfg(not(any(feature = "testing", test)))]
/// The interval at which we check for new rate limit monitors
const RATE_LIMIT_MONITOR_INTERVAL: Duration = Duration::from_secs(2);
#[cfg(any(feature = "testing", test))]
const RATE_LIMIT_MONITOR_INTERVAL: Duration = Duration::from_millis(100);

pub type RateLimitMonitorMap =
    Arc<RwLock<HashMap<RouterId, ProviderRateLimitMonitor>>>;

#[derive(Debug)]
pub enum ProviderRateLimitMonitor {
    Weighted(ProviderMonitorInner<WeightedKey>),
    P2C(ProviderMonitorInner<Key>),
}

impl ProviderRateLimitMonitor {
    fn weighted(
        tx: Sender<Change<WeightedKey, DispatcherService>>,
        router_id: RouterId,
        router_config: Arc<RouterConfig>,
        app_state: AppState,
    ) -> Self {
        Self::Weighted(ProviderMonitorInner::new(
            tx,
            router_id,
            router_config,
            app_state,
        ))
    }

    fn p2c(
        tx: Sender<Change<Key, DispatcherService>>,
        router_id: RouterId,
        router_config: Arc<RouterConfig>,
        app_state: AppState,
    ) -> Self {
        Self::P2C(ProviderMonitorInner::new(
            tx,
            router_id,
            router_config,
            app_state,
        ))
    }
}

/// Monitors health of provider APIs and emits [`Change`] events when providers
/// rate limit us.
#[derive(Debug)]
pub struct ProviderMonitorInner<K> {
    tx: Sender<Change<K, DispatcherService>>,
    router_id: RouterId,
    router_config: Arc<RouterConfig>,
    app_state: AppState,
}

impl<K> ProviderMonitorInner<K> {
    fn new(
        tx: Sender<Change<K, DispatcherService>>,
        router_id: RouterId,
        router_config: Arc<RouterConfig>,
        app_state: AppState,
    ) -> Self {
        Self {
            tx,
            router_id,
            router_config,
            app_state,
        }
    }
}

impl ProviderMonitorInner<Key> {
    fn create_key_for_endpoint(api_endpoint: ApiEndpoint) -> Key {
        let provider = api_endpoint.provider();
        let endpoint_type = api_endpoint.endpoint_type();
        Key::new(provider, endpoint_type)
    }

    async fn monitor(
        self,
        mut rx: Receiver<RateLimitEvent>,
    ) -> Result<(), RuntimeError> {
        info!(router_id = ?self.router_id, "Starting P2C rate limit monitor");

        let mut rate_limited_providers: HashSet<Key> = HashSet::default();
        let mut pending_restores: FuturesUnordered<ProviderRestore<Key>> =
            FuturesUnordered::new();

        loop {
            tokio::select! {
                // Handle incoming rate limit events
                Some(event) = rx.recv() => {
                    let key = Self::create_key_for_endpoint(event.api_endpoint);
                    if rate_limited_providers.contains(&key) {
                        info!(
                            provider = ?event.api_endpoint.provider(),
                            endpoint = ?event.api_endpoint.endpoint_type(),
                            "Provider already rate-limited, ignoring duplicate event"
                        );
                    } else {
                        debug!(
                            provider = ?event.api_endpoint.provider(),
                            api_endpoint = ?event.api_endpoint,
                            router_id = ?self.router_id,
                            "Removing rate-limited provider from P2C balancer"
                        );

                        if let Err(e) = self.tx.send(Change::Remove(key)).await {
                            error!(error = ?e, "Failed to send remove event for rate-limited provider");
                        }


                        let duration = Duration::from_secs(
                            event.retry_after_seconds.unwrap_or(DEFAULT_WAIT_SECONDS)
                        ) + RATE_LIMIT_BUFFER_SECONDS;

                        let restore = ProviderRestore {
                            key: Some(key),
                            api_endpoint: event.api_endpoint,
                            timer: tokio::time::sleep(duration),
                        };
                        pending_restores.push(restore);
                        rate_limited_providers.insert(key);
                        info!(
                            provider = ?event.api_endpoint.provider(),
                            endpoint = ?event.api_endpoint.endpoint_type(),
                            duration_secs = duration.as_secs(),
                            "Scheduled provider re-addition"
                        );
                    }
                }
                // Handle provider restoration
                Some((key, api_endpoint)) = pending_restores.next() => {
                    info!(
                        provider = ?api_endpoint.provider(),
                        endpoint = ?api_endpoint.endpoint_type(),
                        "Re-adding provider to P2C balancer after rate limit expired"
                    );

                    let service = Dispatcher::new(
                        self.app_state.clone(),
                        &self.router_id,
                        &self.router_config,
                        api_endpoint.provider(),
                    )
                    .await
                    .inspect_err(|e| {
                            warn!(
                                error = ?e,
                                provider = ?api_endpoint.provider(),
                                api_endpoint = ?api_endpoint,
                                router_id = ?self.router_id,
                                "Failed to create dispatcher for recovered provider"
                            );
                        })?;

                    self.tx.send(Change::Insert(key, service)).await.map_err(|e| {
                        error!(error = ?e, router_id = ?self.router_id, "Failed to send insert event for recovered provider");
                        RuntimeError::ChannelSendFailed
                    })?;
                    rate_limited_providers.remove(&key);
                }
                // Channel closed - shutdown gracefully
                else => {
                    info!("Rate limit channel closed, shutting down P2C monitor");
                    break;
                }
            }
        }
        Ok(())
    }
}

impl ProviderMonitorInner<WeightedKey> {
    fn create_key_for_endpoint(
        &self,
        api_endpoint: ApiEndpoint,
    ) -> Result<WeightedKey, InternalError> {
        let provider = api_endpoint.provider();
        let endpoint_type = api_endpoint.endpoint_type();

        let Some(balance_config) =
            self.router_config.load_balance.0.get(&endpoint_type)
        else {
            tracing::error!(
                router_id = ?self.router_id,
                endpoint_type = ?endpoint_type,
                "No balance config found for endpoint type"
            );
            return Err(InternalError::Internal);
        };

        match balance_config {
            BalanceConfigInner::Weighted { targets } => {
                for target in targets {
                    if target.provider == provider {
                        let weight = Weight::from(
                            target
                                .weight
                                .to_f64()
                                .ok_or_else(|| InternalError::Internal)?,
                        );
                        return Ok(WeightedKey::new(
                            provider,
                            endpoint_type,
                            weight,
                        ));
                    }
                }
                tracing::error!(
                    router_id = ?self.router_id,
                    endpoint_type = ?endpoint_type,
                    api_endpoint = ?api_endpoint,
                    "No target found for API endpoint in balance config"
                );
                Err(InternalError::Internal)
            }
            BalanceConfigInner::Latency { .. } => Err(InternalError::Internal),
        }
    }

    async fn monitor(
        self,
        mut rx: Receiver<RateLimitEvent>,
    ) -> Result<(), RuntimeError> {
        info!(router_id = ?self.router_id, "Starting Weighted rate limit monitor");

        let mut rate_limited_providers: HashMap<WeightedKey, Instant> =
            HashMap::default();
        let mut pending_restores: FuturesUnordered<
            ProviderRestore<WeightedKey>,
        > = FuturesUnordered::new();

        loop {
            tokio::select! {
                // Handle incoming rate limit events
                Some(event) = rx.recv() => {
                    let key = self.create_key_for_endpoint(event.api_endpoint)?;
                    if let std::collections::hash_map::Entry::Vacant(e) = rate_limited_providers.entry(key) {
                        debug!(
                            provider = ?event.api_endpoint.provider(),
                            api_endpoint = ?event.api_endpoint,
                            router_id = ?self.router_id,
                            "Removing rate-limited provider from Weighted balancer"
                        );

                        if let Err(e) = self.tx.send(Change::Remove(key)).await {
                            error!(error = ?e, "Failed to send remove event for rate-limited provider");
                        }
                        e.insert(Instant::now());

                        let duration = Duration::from_secs(
                            event.retry_after_seconds.unwrap_or(DEFAULT_WAIT_SECONDS)
                        ) + RATE_LIMIT_BUFFER_SECONDS;
                        info!(
                            provider = ?event.api_endpoint.provider(),
                            endpoint_type = ?event.api_endpoint.endpoint_type(),
                            api_endpoint = ?event.api_endpoint,
                            router_id = ?self.router_id,
                            duration_secs = duration.as_secs(),
                            "Scheduled provider re-addition"
                        );

                        let restore = ProviderRestore {
                            key: Some(key),
                            api_endpoint: event.api_endpoint,
                            timer: tokio::time::sleep(duration),
                        };
                        pending_restores.push(restore);
                    } else {
                        info!(
                            provider = ?event.api_endpoint.provider(),
                            endpoint = ?event.api_endpoint.endpoint_type(),
                            "Provider already rate-limited, ignoring duplicate event"
                        );
                    }
                }
                // Handle provider restoration when rate limit expires
                Some((key, api_endpoint)) = pending_restores.next() => {
                    info!(
                        provider = ?api_endpoint.provider(),
                        endpoint = ?api_endpoint.endpoint_type(),
                        api_endpoint = ?api_endpoint,
                        router_id = ?self.router_id,
                        "Re-adding provider to Weighted balancer after rate limit expired"
                    );

                    let service = Dispatcher::new(
                        self.app_state.clone(),
                        &self.router_id,
                        &self.router_config,
                        api_endpoint.provider(),
                    )
                    .await
                    .inspect_err(|e| {
                        error!(
                            error = ?e,
                            provider = ?api_endpoint.provider(),
                            api_endpoint = ?api_endpoint,
                            router_id = ?self.router_id,
                            "Failed to create dispatcher for recovered provider"
                        );
                    })?;
                    self.tx.send(Change::Insert(key, service))
                        .await
                        .map_err(|e| {
                            error!(error = ?e, router_id = ?self.router_id, "Failed to send insert event for recovered provider");
                            RuntimeError::ChannelSendFailed
                        })?;
                    rate_limited_providers.remove(&key);
                }
                // Channel closed - shutdown gracefully
                else => {
                    info!("Rate limit channel closed, shutting down Weighted monitor");
                    break;
                }
            }
        }
        Ok(())
    }
}

#[derive(Debug)]
pub struct RateLimitMonitor {
    app_state: AppState,
    tasks: JoinSet<Result<(), RuntimeError>>,
}

impl RateLimitMonitor {
    #[must_use]
    pub fn new(app_state: AppState) -> Self {
        Self {
            app_state,
            tasks: JoinSet::new(),
        }
    }

    pub async fn run_forever(mut self) -> Result<(), RuntimeError> {
        info!("Starting provider rate limit monitors");
        let mut interval = time::interval(RATE_LIMIT_MONITOR_INTERVAL);
        let app_state = self.app_state.clone();

        loop {
            tokio::select! {
                Some(res) = self.tasks.join_next() => {
                    match res {
                        Ok(Ok(())) => {
                            info!("Rate limit monitor task shutdown successfully");
                        }
                        Ok(Err(e)) => {
                            error!(error = ?e, "Rate limit monitor task failed");
                            return Err(e);
                        },
                        Err(e) => {
                            error!(error = ?e, "Tokio runtime failed to join rate limit monitor task");
                            return Err(e.into());
                        },
                    }
                }
                _ = interval.tick() => {
                    // Check for new routers
                    let mut monitors = app_state.0.rate_limit_monitors.write().await;
                    for (router_id, monitor) in monitors.drain() {
                        let rx = app_state.remove_rate_limit_receiver(&router_id).await?;
                        match monitor {
                            ProviderRateLimitMonitor::Weighted(inner) => {
                                self.tasks.spawn(inner.monitor(rx));
                            },
                            ProviderRateLimitMonitor::P2C(inner) => {
                                self.tasks.spawn(inner.monitor(rx));
                            },
                        }
                    }
                }
            }
        }
    }
}

impl meltdown::Service for RateLimitMonitor {
    type Future = BoxFuture<'static, Result<(), RuntimeError>>;

    fn run(self, mut token: Token) -> Self::Future {
        Box::pin(async move {
            tokio::select! {
                result = self.run_forever() => {
                    if let Err(e) = result {
                        error!(name = "provider-rate-limit-monitor-task", error = ?e, "Monitor encountered error, shutting down");
                    } else {
                        info!(name = "provider-rate-limit-monitor-task", "Monitor shut down successfully");
                    }
                    token.trigger();
                }
                () = &mut token => {
                    info!(name = "provider-rate-limit-monitor-task", "task shut down successfully");
                }
            }
            Ok(())
        })
    }
}

impl AppState {
    pub async fn add_weighted_router_rate_limit_monitor(
        &self,
        router_id: RouterId,
        router_config: Arc<RouterConfig>,
        tx: Sender<Change<WeightedKey, DispatcherService>>,
    ) {
        self.0.rate_limit_monitors.write().await.insert(
            router_id.clone(),
            ProviderRateLimitMonitor::weighted(
                tx,
                router_id,
                router_config,
                self.clone(),
            ),
        );
    }

    pub async fn add_p2c_router_rate_limit_monitor(
        &self,
        router_id: RouterId,
        router_config: Arc<RouterConfig>,
        tx: Sender<Change<Key, DispatcherService>>,
    ) {
        self.0.rate_limit_monitors.write().await.insert(
            router_id.clone(),
            ProviderRateLimitMonitor::p2c(
                tx,
                router_id,
                router_config,
                self.clone(),
            ),
        );
    }

    pub async fn remove_rate_limit_receiver(
        &self,
        router_id: &RouterId,
    ) -> Result<Receiver<RateLimitEvent>, InitError> {
        let Some(rx) =
            self.0.rate_limit_receivers.write().await.remove(router_id)
        else {
            warn!(router_id = ?router_id, "No rate limit receiver found for router");
            return Err(InitError::RateLimitChannelsNotInitialized(
                router_id.clone(),
            ));
        };
        Ok(rx)
    }
}
