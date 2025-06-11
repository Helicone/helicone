use std::{
    sync::Arc,
    task::{Context, Poll},
};

use futures::future::BoxFuture;
use tokio::sync::mpsc::Receiver;
use tower::{
    Service,
    discover::Change,
    load::{CompleteOnResponse, PeakEwmaDiscover},
};

use crate::{
    app_state::AppState,
    config::router::RouterConfig,
    discover::provider::{Key, discover::Discovery},
    dispatcher::DispatcherService,
    error::init::InitError,
    types::router::RouterId,
};

#[derive(Debug)]
pub struct DiscoverFactory {
    pub(crate) app_state: AppState,
    pub(crate) router_id: RouterId,
    pub(crate) router_config: Arc<RouterConfig>,
}

impl DiscoverFactory {
    #[must_use]
    pub fn new(
        app_state: AppState,
        router_id: RouterId,
        router_config: Arc<RouterConfig>,
    ) -> Self {
        Self {
            app_state,
            router_id,
            router_config,
        }
    }
}

impl Service<Receiver<Change<Key, DispatcherService>>> for DiscoverFactory {
    type Response = PeakEwmaDiscover<Discovery<Key>>;
    type Error = InitError;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

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
        let app_state = self.app_state.clone();
        let router_id = self.router_id;
        let router_config = self.router_config.clone();
        Box::pin(async move {
            let discovery =
                Discovery::new(&app_state, router_id, &router_config, rx)
                    .await?;
            let discovery = PeakEwmaDiscover::new(
                discovery,
                app_state.0.config.discover.default_rtt,
                app_state.0.config.discover.discover_decay,
                CompleteOnResponse::default(),
            );

            Ok(discovery)
        })
    }
}
