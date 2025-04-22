pub mod config;
pub mod factory;
pub mod monitor;

use std::{
    convert::Infallible,
    pin::Pin,
    task::{Context, Poll},
};

use config::ConfigDiscovery;
use derive_more::AsRef;
use futures::Stream;
use pin_project::pin_project;
use tokio::sync::mpsc::Receiver;
use tower::discover::Change;

use crate::{
    app::AppState, dispatcher::DispatcherService, types::provider::Provider,
};

#[derive(Debug, AsRef)]
pub struct ProviderChangeBroadcasts {
    // pub tx: HashMap<Model, Sender<Change<Key, DispatcherService>>>,
    // pub rx: HashMap<Model, Receiver<Change<Key, DispatcherService>>>,
}

// impl ProviderChangeBroadcasts {
//     pub fn new(config: &Config) -> Self {
//         let mut tx_map = HashMap::new();
//         let mut rx_map = HashMap::new();
//         let models = config
//             .discover
//             .models
//             .0
//             .values()
//             .flatten()
//             .collect::<HashSet<_>>();
//         for model in models {
//             let (tx, rx) = broadcast::channel(128);
//             tx_map.insert(model.clone(), tx);
//             rx_map.insert(model.clone(), rx);
//         }
//         Self {
//             tx: tx_map,
//             rx: rx_map,
//         }
//     }
// }

#[derive(Debug, Clone, Eq, PartialEq, Hash)]
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
    pub fn config(
        app_state: AppState,
        rx: Receiver<Change<Key, DispatcherService>>,
    ) -> Self {
        Self::Config(ConfigDiscovery::new(app_state, rx))
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
