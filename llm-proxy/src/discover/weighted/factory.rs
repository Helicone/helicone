use std::{
    future::{Ready, ready},
    task::{Context, Poll},
};

use tokio::sync::mpsc::Receiver;
use tower::{Service, discover::Change};
use weighted_balance::weight::WeightedDiscover;

use crate::{
    discover::{
        provider::{discover::Discovery, factory::DiscoverFactory},
        weighted::WeightedKey,
    },
    dispatcher::DispatcherService,
    error::init::InitError,
};

impl Service<Receiver<Change<WeightedKey, DispatcherService>>>
    for DiscoverFactory
{
    type Response = WeightedDiscover<Discovery<WeightedKey>>;
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
        let discovery = match Discovery::new_weighted(
            &self.app_state,
            &self.router_config,
            rx,
        ) {
            Ok(discovery) => discovery,
            Err(e) => return ready(Err(e)),
        };
        let discovery = WeightedDiscover::new(discovery);
        ready(Ok(discovery))
    }
}
