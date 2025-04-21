use std::{
    convert::Infallible,
    future::Ready,
    task::{Context, Poll},
};

use tower::Service;

use super::{Discovery, Key};
use crate::app::AppState;

#[derive(Debug)]
pub struct ProviderDiscoverFactory {
    _state: AppState,
}

impl Service<Key> for ProviderDiscoverFactory {
    type Response = Discovery;
    type Error = Infallible;
    type Future = Ready<Result<Self::Response, Self::Error>>;

    fn poll_ready(
        &mut self,
        _: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    fn call(&mut self, _key: Key) -> Self::Future {
        // build the right Discover for this model
        todo!()
        // let discovery =
        // Discovery::config(self.state.clone(), &key.model, &[key.provider]);
        // ready(Ok(discovery))
    }
}
