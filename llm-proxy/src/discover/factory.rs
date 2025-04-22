use std::{
    convert::Infallible,
    future::Ready,
    task::{Context, Poll},
};

use tower::Service;

use super::Discovery;
use crate::{app::AppState, types::model::Model};

/// Could be used to dynamically add new regions.
#[derive(Debug)]
pub struct DiscoverFactory {
    _state: AppState,
}

impl Service<Model> for DiscoverFactory {
    type Response = Discovery;
    type Error = Infallible;
    type Future = Ready<Result<Self::Response, Self::Error>>;

    fn poll_ready(
        &mut self,
        _: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    fn call(&mut self, _model: Model) -> Self::Future {
        todo!()
    }
}
