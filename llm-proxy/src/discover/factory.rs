use std::{
    convert::Infallible,
    future::{ready, Ready},
    task::{Context, Poll},
};

use tower::Service;

use super::{Key, ProviderDiscovery};
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
        let rx = self.state.0.broadcasts.rx.entry(model).or_insert_with(|| {
            let (tx, rx) = tokio::sync::broadcast::channel(128);
            self.state.0.broadcasts.tx.insert(model, tx);
            rx
        }).resubscribe();
        let discovery = ProviderDiscovery::config(self.state.clone(), key.model, rx);
        ready(Ok(discovery))
    }
}
