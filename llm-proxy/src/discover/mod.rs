pub mod config;

use std::{
    convert::Infallible,
    pin::Pin,
    task::{Context, Poll},
};

use config::ConfigDiscovery;
use futures::Stream;
use pin_project::pin_project;
use tower::discover::Change;

use crate::{
    app::AppState, dispatcher::DispatcherService, types::{model::Model, provider::Provider}
};

#[derive(Debug, Clone, Eq, PartialEq, Hash)]
pub struct Key {
    pub model: Model,
    pub provider: Provider,
}

impl Key {
    pub fn new(model: Model, provider: Provider) -> Self {
        Self { model, provider }
    }
}

#[derive(Debug)]
#[pin_project(project = EnumProj)]
pub enum Discovery {
    Config(#[pin] ConfigDiscovery),
}

impl Discovery {
    pub fn config(app_state: AppState, model: &Model, providers: &[Provider]) -> Self {
        Self::Config(ConfigDiscovery::service_list(app_state, model, providers))
    }
}

impl Stream for Discovery {
    type Item = Result<Change<usize, DispatcherService>, Infallible>;

    fn poll_next(
        self: Pin<&mut Self>,
        ctx: &mut Context<'_>,
    ) -> Poll<Option<Self::Item>> {
        match self.project() {
            EnumProj::Config(config) => config.poll_next(ctx),
        }
    }
}
