use std::collections::HashMap;

use futures::future::BoxFuture;
use meltdown::Token;
use tokio::sync::mpsc::Sender;
use tower::discover::Change;
use tracing::info;

use super::Key;
use crate::{
    discover::weighted::WeightedKey, dispatcher::DispatcherService,
    error::runtime, types::router::RouterId,
};

pub enum ProviderMonitor {
    Weighted(ProviderMonitorInner<WeightedKey>),
    P2C(ProviderMonitorInner<Key>),
}

impl ProviderMonitor {
    pub fn weighted(
        tx: Sender<Change<WeightedKey, DispatcherService>>,
    ) -> Self {
        Self::Weighted(ProviderMonitorInner::new(tx))
    }

    pub fn p2c(tx: Sender<Change<Key, DispatcherService>>) -> Self {
        Self::P2C(ProviderMonitorInner::new(tx))
    }
}

/// Could monitor health from URLs like:
///
/// <https://status.openai.com/proxy/status.openai.com>
///
/// or more creative methods if required.
pub struct ProviderMonitorInner<K> {
    _tx: Sender<Change<K, DispatcherService>>,
}

impl<K> ProviderMonitorInner<K> {
    pub fn new(tx: Sender<Change<K, DispatcherService>>) -> Self {
        Self { _tx: tx }
    }
}

pub struct ProviderMonitors {
    _txs: HashMap<RouterId, ProviderMonitor>,
}

impl ProviderMonitors {
    pub fn new(txs: HashMap<RouterId, ProviderMonitor>) -> Self {
        Self { _txs: txs }
    }
}

impl meltdown::Service for ProviderMonitors {
    type Future = BoxFuture<'static, Result<(), runtime::RuntimeError>>;

    fn run(self, token: Token) -> Self::Future {
        Box::pin(async move {
            token.await;
            info!(name = "provider-monitor-task", "task shutdown successfully");
            Ok(())
        })
    }
}
