use std::{
    convert::Infallible,
    pin::Pin,
    task::{Context, Poll},
};

use futures::Stream;
use nonempty_collections::NEVec;
use pin_project::pin_project;
use tokio::sync::mpsc::Receiver;
use tower::discover::Change;

use super::WeightedKey;
use crate::{
    app::AppState,
    config::{DeploymentTarget, router::BalanceTarget},
    discover::weighted::config::ConfigDiscovery,
    dispatcher::DispatcherService,
    error::init::InitError,
};

/// WeightedDiscover endpoints keyed by [`Key`].
#[derive(Debug)]
#[pin_project(project = DiscoveryProj)]
pub enum Discovery {
    Config(#[pin] ConfigDiscovery),
}

impl Discovery {
    pub fn new(
        app_state: &AppState,
        weighted_balance_targets: NEVec<BalanceTarget>,
        rx: Receiver<Change<WeightedKey, DispatcherService>>,
    ) -> Result<Self, InitError> {
        // TODO: currently we also have a separate discovery_mode.
        // we should consolidate.
        match app_state.0.config.deployment_target {
            DeploymentTarget::SelfHosted => Ok(Self::Config(
                ConfigDiscovery::new(app_state, weighted_balance_targets, rx)?,
            )),
            DeploymentTarget::Cloud | DeploymentTarget::Sidecar => {
                todo!("cloud and sidecar not supported yet")
            }
        }
    }
}

impl Stream for Discovery {
    type Item = Result<Change<WeightedKey, DispatcherService>, Infallible>;

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
