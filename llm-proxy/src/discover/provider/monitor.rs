use std::collections::HashMap;

use futures::future::BoxFuture;
use meltdown::Token;
use tokio::sync::mpsc::Sender;
use tower::discover::Change;
use tracing::info;

use crate::{
    discover::Key, dispatcher::DispatcherService, error::runtime,
    types::router::RouterId,
};

/// Could monitor health from URLs like:
///
/// https://status.openai.com/proxy/status.openai.com
///
/// or more creative methods if required.
pub struct ProviderMonitor {
    _tx: Sender<Change<Key, DispatcherService>>,
}

impl ProviderMonitor {
    pub fn new(tx: Sender<Change<Key, DispatcherService>>) -> Self {
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
