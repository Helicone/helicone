use std::{
    convert::Infallible,
    hash::Hash,
    pin::Pin,
    sync::Arc,
    task::{Context, Poll},
};

use futures::Stream;
use pin_project_lite::pin_project;
use tokio::sync::mpsc::Receiver;
use tower::discover::Change;

use crate::{
    app::AppState,
    config::router::RouterConfig,
    discover::{
        provider::{Key, config::ConfigDiscovery},
        weighted::WeightedKey,
    },
    dispatcher::DispatcherService,
    error::init::InitError,
    types::discover::DiscoverMode,
};

pin_project! {
    /// Discover endpoints keyed by [`K`].
    #[derive(Debug)]
    #[project = DiscoveryProj]
    pub enum Discovery<K> {
        Config {
            #[pin] inner: ConfigDiscovery<K>,
        },
    }
}

impl Discovery<Key> {
    pub fn new(
        app_state: &AppState,
        router_config: &Arc<RouterConfig>,
        rx: Receiver<Change<Key, DispatcherService>>,
    ) -> Result<Self, InitError> {
        let provider_keys = app_state
            .0
            .config
            .discover
            .provider_keys(&router_config.balance)?;
        match app_state.0.config.discover.discover_mode {
            DiscoverMode::Config => Ok(Self::Config {
                inner: ConfigDiscovery::new(
                    app_state,
                    router_config,
                    &provider_keys,
                    rx,
                )?,
            }),
        }
    }
}

impl Discovery<WeightedKey> {
    pub fn new_weighted(
        app_state: &AppState,
        router_config: &Arc<RouterConfig>,
        rx: Receiver<Change<WeightedKey, DispatcherService>>,
    ) -> Result<Self, InitError> {
        let provider_keys = app_state
            .0
            .config
            .discover
            .provider_keys(&router_config.balance)?;
        match app_state.0.config.discover.discover_mode {
            DiscoverMode::Config => Ok(Self::Config {
                inner: ConfigDiscovery::new_weighted(
                    app_state,
                    router_config,
                    &provider_keys,
                    rx,
                )?,
            }),
        }
    }
}

impl<K> Stream for Discovery<K>
where
    K: Hash + Eq + Clone + std::fmt::Debug,
{
    type Item = Result<Change<K, DispatcherService>, Infallible>;

    fn poll_next(
        self: Pin<&mut Self>,
        ctx: &mut Context<'_>,
    ) -> Poll<Option<Self::Item>> {
        match self.project() {
            DiscoveryProj::Config { inner } => {
                inner.poll_next(ctx).map(|p| p.map(Result::Ok))
            }
        }
    }
}
