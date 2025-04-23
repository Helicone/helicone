use std::{
    future::{ready, Ready},
    task::{Context, Poll}, time::Duration,
};

use tokio::sync::mpsc::Receiver;
use tower::{discover::Change, load::PeakEwmaDiscover, Service};

use crate::{app::AppState, discover::{Discovery, Key}, dispatcher::DispatcherService, error::init::InitError};

const DEFAULT_PROVIDER_RTT: Duration = Duration::from_millis(500);

#[derive(Debug)]
pub struct DiscoverFactory {
    app_state: AppState,
}

impl DiscoverFactory {
    pub fn new(app_state: AppState) -> Self {
        Self { app_state }
    }
}

impl Service<Receiver<Change<Key, DispatcherService>>> for DiscoverFactory {
    type Response = PeakEwmaDiscover<Discovery>;
    type Error = InitError;
    type Future = Ready<Result<Self::Response, Self::Error>>;

    fn poll_ready(
        &mut self,
        _: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    fn call(&mut self, rx: Receiver<Change<Key, DispatcherService>>) -> Self::Future {
        let discovery = match Discovery::new(self.app_state.clone(), rx) {
            Ok(discovery) => discovery,
            Err(e) => return ready(Err(e))
        };
        let x = self.app_state.0.config.discover.discover_decay;
        tracing::info!(decay = ?x, "discover_decay");
        let discovery = PeakEwmaDiscover::new(
            discovery,
            DEFAULT_PROVIDER_RTT,
            self.app_state.0.config.discover.discover_decay,
            Default::default(),
        );

        ready(Ok(discovery))
    }
}
