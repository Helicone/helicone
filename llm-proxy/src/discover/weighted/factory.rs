use std::{
    future::{Ready, ready},
    sync::Arc,
    task::{Context, Poll},
};

use tokio::sync::mpsc::Receiver;
use tower::{Service, discover::Change};
use weighted_balance::weight::WeightedDiscover;

use crate::{
    app::AppState,
    config::router::{BalanceConfig, RouterConfig},
    discover::weighted::{WeightedKey, discover::Discovery},
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

impl Service<Receiver<Change<WeightedKey, DispatcherService>>>
    for DiscoverFactory
{
    type Response = WeightedDiscover<Discovery>;
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
        rx: Receiver<Change<WeightedKey, DispatcherService>>,
    ) -> Self::Future {
        let weighted_balance_targets = match &self.router_config.balance {
            BalanceConfig::Weighted { targets } => targets.clone(),
            BalanceConfig::P2C { .. } => {
                return ready(Err(InitError::InvalidBalancerInitialization));
            }
        };
        let discovery = match Discovery::new(
            &self.app_state,
            weighted_balance_targets,
            rx,
        ) {
            Ok(discovery) => discovery,
            Err(e) => return ready(Err(e)),
        };
        let discovery = WeightedDiscover::new(discovery);
        ready(Ok(discovery))
    }
}
