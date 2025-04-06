use reqwest::Client;
use tower::{discover::ServiceList, util::BoxService};

use crate::{
    dispatcher::{Dispatcher, DispatcherService},
    types::config::DispatcherConfig,
};

pub struct Registry;

impl Registry {
    pub fn services(
        config: &DispatcherConfig,
    ) -> ServiceList<Vec<DispatcherService>> {
        let mut services = Vec::new();
        for (provider, _url) in config.provider_urls.iter() {
            let dispatcher = Dispatcher::new(Client::new(), provider.clone());
            services.push(BoxService::new(dispatcher));
        }
        ServiceList::new(services)
    }
}
