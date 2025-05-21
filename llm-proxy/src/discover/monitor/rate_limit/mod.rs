#![allow(dead_code)]
use std::{collections::HashMap, sync::Arc};

use futures::future::BoxFuture;
use meltdown::Token;
use tokio::sync::{RwLock, mpsc::Sender};
use tower::discover::Change;
use tracing::info;

use crate::{
    discover::{provider::Key, weighted::WeightedKey},
    dispatcher::DispatcherService,
    error::runtime,
    types::{provider::InferenceProvider, router::RouterId},
};

#[derive(Debug, Clone)]
enum ProviderMonitor {
    Weighted(RateLimitMonitorInner<WeightedKey>),
    P2C(RateLimitMonitorInner<Key>),
}

impl ProviderMonitor {
    fn weighted(tx: Sender<Change<WeightedKey, DispatcherService>>) -> Self {
        Self::Weighted(RateLimitMonitorInner::new(tx))
    }

    fn p2c(tx: Sender<Change<Key, DispatcherService>>) -> Self {
        Self::P2C(RateLimitMonitorInner::new(tx))
    }
}

#[derive(Debug, Clone)]
struct RateLimitMonitorInner<K> {
    _tx: Sender<Change<K, DispatcherService>>,
}

impl<K> RateLimitMonitorInner<K> {
    fn new(tx: Sender<Change<K, DispatcherService>>) -> Self {
        Self { _tx: tx }
    }
}

#[derive(Debug, Clone)]
struct ProviderRateLimitMonitors {
    _txs: HashMap<InferenceProvider, ProviderMonitor>,
}

impl ProviderRateLimitMonitors {
    fn new(txs: HashMap<InferenceProvider, ProviderMonitor>) -> Self {
        Self { _txs: txs }
    }
}

#[derive(Debug, Default, Clone)]
pub struct RateLimitMonitor {
    inner: Arc<RwLock<HashMap<RouterId, ProviderRateLimitMonitors>>>,
}

impl meltdown::Service for RateLimitMonitor {
    type Future = BoxFuture<'static, Result<(), runtime::RuntimeError>>;

    fn run(self, token: Token) -> Self::Future {
        Box::pin(async move {
            token.await;
            info!(
                name = "rate-limit-monitor-task",
                "task shutdown successfully"
            );
            Ok(())
        })
    }
}
