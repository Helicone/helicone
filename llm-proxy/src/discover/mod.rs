pub mod config;
pub mod factory;

use std::{
    collections::{HashMap, HashSet},
    convert::Infallible,
    pin::Pin,
    task::{Context, Poll},
};

use config::ConfigDiscovery;
use derive_more::AsRef;
use futures::Stream;
use pin_project::pin_project;
use tokio::sync::broadcast::{self, Receiver, Sender};
use tokio_stream::wrappers::errors::BroadcastStreamRecvError;
use tower::discover::Change;

use crate::{
    app::AppState,
    config::Config,
    dispatcher::DispatcherService,
    types::{model::Model, provider::Provider},
};

#[derive(Debug, AsRef)]
pub struct ProviderChangeBroadcasts {
    pub tx: HashMap<Model, Sender<Change<Key, DispatcherService>>>,
    pub rx: HashMap<Model, Receiver<Change<Key, DispatcherService>>>,
}

impl ProviderChangeBroadcasts {
    pub fn new(config: &Config) -> Self {
        let mut tx_map = HashMap::new();
        let mut rx_map = HashMap::new();
        let models = config
            .discover
            .models
            .0
            .values()
            .flatten()
            .collect::<HashSet<_>>();
        for model in models {
            let (tx, rx) = broadcast::channel(128);
            tx_map.insert(model.clone(), tx);
            rx_map.insert(model.clone(), rx);
        }
        Self {
            tx: tx_map,
            rx: rx_map,
        }
    }
}

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
    type Item =
        Result<Change<Key, DispatcherService>, BroadcastStreamRecvError>;

    fn poll_next(
        self: Pin<&mut Self>,
        ctx: &mut Context<'_>,
    ) -> Poll<Option<Self::Item>> {
        match self.project() {
            DiscoveryProj::Config(config) => config.poll_next(ctx),
        }
    }
}

/// Discover providers for a given model.
#[derive(Debug)]
#[pin_project]
pub struct ProviderDiscovery {
    model: Model,
    #[pin]
    inner: Discovery,
}

impl ProviderDiscovery {
    pub fn new(model: Model, inner: Discovery) -> Self {
        Self { model, inner }
    }

    pub fn config(
        app_state: AppState,
        model: Model,
        rx: Receiver<Change<Key, DispatcherService>>,
    ) -> Self {
        Self::new(model, Discovery::config(app_state, rx))
    }
}

impl Stream for ProviderDiscovery {
    type Item = Result<Change<Key, DispatcherService>, Infallible>;

    fn poll_next(
        self: Pin<&mut Self>,
        ctx: &mut Context<'_>,
    ) -> Poll<Option<Self::Item>> {
        let mut this = self.project();
        let model = this.model;

        loop {
            match this.inner.as_mut().poll_next(ctx) {
                Poll::Ready(Some(Ok(change))) => match &change {
                    Change::Insert(key, _) => {
                        if key.model == *model {
                            return Poll::Ready(Some(Ok(change)));
                        }
                    }
                    Change::Remove(key) => {
                        if key.model == *model {
                            return Poll::Ready(Some(Ok(change)));
                        }
                    }
                },
                Poll::Ready(None) => return Poll::Ready(None),
                Poll::Pending => return Poll::Pending,
                // infallible
                Poll::Ready(Some(Err(_))) => unreachable!(),
            }
        }
    }
}
