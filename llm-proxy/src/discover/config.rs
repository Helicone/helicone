use std::collections::HashMap;

use super::Key;
use crate::{
    app::AppState,
    dispatcher::{Dispatcher, DispatcherService},
};

pub type ServiceList = tower::discover::ServiceList<Vec<DispatcherService>>;

/// We'll also add a remote discovery service in the future.
#[derive(Clone)]
pub struct ConfigDiscovery;

impl ConfigDiscovery {
    pub fn service_list(state: AppState) -> ServiceList {
        let mut services = HashMap::new();
        for (provider, models) in state.0.config.models.0.iter() {
            for model in models.iter() {
                let key = Key::new(model.clone(), provider.clone());
                let dispatcher = Dispatcher::new_with_middleware(
                    state.clone(),
                    model.clone(),
                    provider.clone(),
                );
                services.insert(key, dispatcher);
            }
        }
        let services =
            services.into_iter().map(|(_, svc)| svc).collect::<Vec<_>>();
        ServiceList::new(services)
    }
}
