use std::{
    convert::Infallible,
    future::{Ready, ready},
    task::{Context, Poll},
};

use tower::Service;

use super::ProviderDiscovery;
use crate::{app::AppState, types::model::Model};

#[derive(Debug)]
pub struct ProviderDiscoverFactory {
    state: AppState,
}

impl Service<Model> for ProviderDiscoverFactory {
    type Response = ProviderDiscovery;
    type Error = Infallible;
    type Future = Ready<Result<Self::Response, Self::Error>>;

    fn poll_ready(
        &mut self,
        _: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    fn call(&mut self, model: Model) -> Self::Future {
        let state = self.state.clone();
        let mut guard = state.0.broadcasts.blocking_lock();

        let rx = if let Some(rx) = guard.rx.get(&model) {
            rx.resubscribe()
        } else {
            let (tx, rx) = tokio::sync::broadcast::channel(128);
            guard.tx.insert(model.clone(), tx);
            rx
        };

        let discovery =
            ProviderDiscovery::config(self.state.clone(), model, rx);
        ready(Ok(discovery))
    }
}
