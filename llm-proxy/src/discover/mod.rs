pub mod provider;

use std::{
    convert::Infallible,
    pin::Pin,
    task::{Context, Poll},
};

use futures::Stream;
use pin_project::pin_project;
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc::Receiver;
use tower::discover::Change;

use crate::{
    app::AppState, config::DeploymentTarget,
    discover::provider::config::ConfigDiscovery, dispatcher::DispatcherService,
    error::init::InitError, types::provider::Provider,
};

#[derive(Debug, Clone, Eq, PartialEq, Hash, Deserialize, Serialize)]
pub struct Key {
    pub provider: Provider,
}

impl Key {
    pub fn new(provider: Provider) -> Self {
        Self { provider }
    }
}

/// Discover endpoints keyed by [`Key`].
#[derive(Debug)]
#[pin_project(project = DiscoveryProj)]
pub enum Discovery {
    Config(#[pin] ConfigDiscovery),
}

impl Discovery {
    pub fn new(
        app_state: AppState,
        rx: Receiver<Change<Key, DispatcherService>>,
    ) -> Result<Self, InitError> {
        // TODO: currently we also have a separate discovery_mode.
        // we should consolidate.
        match app_state.0.config.deployment_target {
            DeploymentTarget::SelfHosted => Self::config(app_state, rx),
            DeploymentTarget::Cloud | DeploymentTarget::Sidecar => {
                todo!("cloud and sidecar not supported yet")
            }
        }
    }

    pub fn config(
        app_state: AppState,
        rx: Receiver<Change<Key, DispatcherService>>,
    ) -> Result<Self, InitError> {
        Ok(Self::Config(ConfigDiscovery::new(app_state, rx)?))
    }
}

impl Stream for Discovery {
    type Item = Result<Change<Key, DispatcherService>, Infallible>;

    fn poll_next(
        self: Pin<&mut Self>,
        ctx: &mut Context<'_>,
    ) -> Poll<Option<Self::Item>> {
        match self.project() {
            DiscoveryProj::Config(config) => {
                config.poll_next(ctx).map(|p| p.map(Result::Ok))
            }
        }
    }
}
