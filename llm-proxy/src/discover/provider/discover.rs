use std::{
    convert::Infallible,
    pin::Pin,
    sync::Arc,
    task::{Context, Poll},
};

use futures::Stream;
use pin_project::pin_project;
use tokio::sync::mpsc::Receiver;
use tower::discover::Change;

use crate::{
    app::AppState,
    config::{DeploymentTarget, router::RouterConfig},
    discover::provider::{Key, config::ConfigDiscovery},
    dispatcher::DispatcherService,
    error::init::InitError,
};

/// Discover endpoints keyed by [`Key`].
#[derive(Debug)]
#[pin_project(project = DiscoveryProj)]
pub enum Discovery {
    Config(#[pin] ConfigDiscovery),
}

impl Discovery {
    pub fn new(
        app_state: &AppState,
        router_config: &Arc<RouterConfig>,
        rx: Receiver<Change<Key, DispatcherService>>,
    ) -> Result<Self, InitError> {
        // TODO: currently we also have a separate discovery_mode.
        // we should consolidate.
        match app_state.0.config.deployment_target {
            DeploymentTarget::SelfHosted => Ok(Self::Config(
                ConfigDiscovery::new(app_state, router_config, rx)?,
            )),
            DeploymentTarget::Cloud | DeploymentTarget::Sidecar => {
                todo!("cloud and sidecar not supported yet")
            }
        }
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
