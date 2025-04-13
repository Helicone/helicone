use reqwest::Client;

use crate::{config::dispatcher::DispatcherConfig, dispatcher::Dispatcher};

/// Registry of all AI provider backends.
///
/// Since each [`DispatcherService`] can be used to proxy any backend provider,
/// this contains all [`DispatcherService`]s for all providers in our
/// [`DispatcherConfig`].
///
/// Since we can't support dynamically adding providers due to needing to create
/// mappings at compile time, we can simply use the
/// [`tower::discover::ServiceList`]. For dynamic updates the
/// [`tower::discover::Discover`] trait can be used.
pub struct Registry {
    pub services: Vec<Dispatcher>,
}

impl Registry {
    /// Create a [`DispatcherService`] for all providers in the
    /// [`DispatcherConfig`].
    pub fn new(config: &DispatcherConfig) -> Registry {
        // *NOTE*: if you wanted to provide middleware specific to AI providers,
        // you could do so here by layering the respective dispatcher with the
        // appropriate middleware.
        let mut services = Vec::new();
        for (provider, _url) in config.provider_urls.iter() {
            let dispatcher = Dispatcher::new(Client::new(), provider.clone());
            services.push(dispatcher);
        }
        Registry { services }
    }
}
