use std::task::{Context, Poll};

use futures::future::BoxFuture;
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
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

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
        let app_state = self.app_state.clone();
        let router_id = self.router_id;
        let router_config = self.router_config.clone();
        Box::pin(async move {
            let discovery = Discovery::new_weighted(
                &app_state,
                router_id,
                &router_config,
                rx,
            )
            .await?;
            let discovery = WeightedDiscover::new(discovery);
            Ok(discovery)
        })
    }
}
