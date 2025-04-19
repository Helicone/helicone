use tower::discover::Discover;
pub mod config;

use crate::{app::AppState, config::models::ModelsConfig, error::api::Error, types::{model::Model, provider::Provider}};

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

#[derive(Debug, Clone)]
struct ProviderDiscovery {
    rx: tokio::sync::watch::Receiver<HashMap<Key, Provider>>
}

impl ProviderDiscovery {
    pub fn new(state: AppState) -> Self {
        // cloning is fine as it happens once at startup
        Self { models: state.0.config.models.clone() }
    }
}

impl Discover for ProviderDiscovery {
    type Key = Key;

    type Service = Provider;

    type Error = Error;

    fn poll_discover(
        self: std::pin::Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Option<Result<tower::discover::Change<Self::Key, Self::Service>, Self::Error>>> {
        todo!()
    }
}
