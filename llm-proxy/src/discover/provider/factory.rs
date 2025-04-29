use std::{
    future::{Ready, ready},
    sync::Arc,
    task::{Context, Poll},
};

use tokio::sync::mpsc::Receiver;
use tower::{Service, discover::Change, load::PeakEwmaDiscover};

use crate::{
    app::AppState,
    config::router::RouterConfig,
    discover::{Discovery, Key},
    dispatcher::DispatcherService,
    error::init::InitError,
};

#[derive(Debug)]
pub struct DiscoverFactory {
    app_state: AppState,
    router_config: Arc<RouterConfig>,
}

impl DiscoverFactory {
    pub fn new(app_state: AppState, router_config: Arc<RouterConfig>) -> Self {
        Self {
            app_state,
            router_config,
        }
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

    fn call(
        &mut self,
        rx: Receiver<Change<Key, DispatcherService>>,
    ) -> Self::Future {
        let discovery = match Discovery::new(
            self.app_state.clone(),
            self.router_config.clone(),
            rx,
        ) {
            Ok(discovery) => discovery,
            Err(e) => return ready(Err(e)),
        };
        let discovery = PeakEwmaDiscover::new(
            discovery,
            self.app_state.0.config.discover.default_rtt,
            self.app_state.0.config.discover.discover_decay,
            Default::default(),
        );

        ready(Ok(discovery))
    }
}
