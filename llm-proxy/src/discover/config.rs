use std::{
    collections::HashMap,
    convert::Infallible,
    pin::Pin,
    task::{Context, Poll},
};

use futures::Stream;
use pin_project::pin_project;
use tower::discover::{Change, ServiceList};

use super::Key;
use crate::{
    app::AppState,
    dispatcher::{Dispatcher, DispatcherService},
    types::{model::Model, provider::Provider},
};

/// Reads available models and providers from the config file.
/// 
/// We can additionally dynamically remove providers from the balancer
/// if they hit certain failure thresholds by using a layer like:
/// 
/// HashMap<usize, DispatcherService>
/// 
/// 
/// ```rust
/// #[derive(Clone)]
/// pub struct FailureWatcherLayer {
///     key: usize,
///     registry: tokio::sync::watch::Sender<HashMap<usize, DispatcherService>>,
///     failure_limit: u32,
///     window: Duration,
/// }
/// ```
#[derive(Debug)]
#[pin_project]
pub struct ConfigDiscovery(#[pin] ServiceList<Vec<DispatcherService>>);

impl ConfigDiscovery {
    pub fn service_list(
        app_state: AppState,
        model: &Model,
        providers: &[Provider],
    ) -> Self {
        let mut services = HashMap::new();
        for provider in providers.iter() {
            let key = Key::new(model.clone(), provider.clone());
            let dispatcher = Dispatcher::new_with_middleware(
                app_state.clone(),
                model.clone(),
                provider.clone(),
            );
            services.insert(key, dispatcher);
        }
        let services =
            services.into_iter().map(|(_, svc)| svc).collect::<Vec<_>>();
        Self(ServiceList::new(services))
    }
}

impl Stream for ConfigDiscovery {
    type Item = Result<Change<usize, DispatcherService>, Infallible>;

    fn poll_next(
        self: Pin<&mut Self>,
        ctx: &mut Context<'_>,
    ) -> Poll<Option<Self::Item>> {
        self.project().0.poll_next(ctx)
    }
}
