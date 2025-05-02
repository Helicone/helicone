use std::{
    collections::HashMap,
    pin::Pin,
    sync::Arc,
    task::{Context, Poll},
};

use futures::Stream;
use pin_project::pin_project;
use tokio::sync::mpsc::Receiver;
use tokio_stream::wrappers::ReceiverStream;
use tower::discover::Change;

use crate::{
    app::AppState,
    config::router::RouterConfig,
    discover::Key,
    dispatcher::{Dispatcher, DispatcherService},
    error::init::InitError,
};

/// Reads available models and providers from the config file.
///
/// We can additionally dynamically remove providers from the balancer
/// if they hit certain failure thresholds by using a layer like:
///
/// ```rust,ignore
/// #[derive(Clone)]
/// pub struct FailureWatcherLayer {
///     key: usize,
///     registry: tokio::sync::watch::Sender<HashMap<usize, DispatcherService>>,
///     failure_limit: u32,
///     window: Duration,
/// }
/// ```
///
/// the layer would then send `Change::Remove` events to this discovery struct
#[derive(Debug)]
#[pin_project]
pub struct ConfigDiscovery {
    #[pin]
    initial: ServiceMap<Key, DispatcherService>,
    #[pin]
    events: ReceiverStream<Change<Key, DispatcherService>>,
}

impl ConfigDiscovery {
    pub fn new(
        app: AppState,
        router_config: Arc<RouterConfig>,
        rx: Receiver<Change<Key, DispatcherService>>,
    ) -> Result<Self, InitError> {
        let events = ReceiverStream::new(rx);
        let mut service_map: HashMap<Key, DispatcherService> = HashMap::new();
        for provider in router_config.providers.iter() {
            let key = Key::new(*provider);
            let dispatcher = Dispatcher::new_with_middleware(app.clone(), key)?;
            service_map.insert(key, dispatcher);
        }

        tracing::trace!("Created config discovery");
        Ok(Self {
            initial: ServiceMap::new(service_map),
            events,
        })
    }
}

impl Stream for ConfigDiscovery {
    type Item = Change<Key, DispatcherService>;

    fn poll_next(
        self: Pin<&mut Self>,
        ctx: &mut Context<'_>,
    ) -> Poll<Option<Self::Item>> {
        let mut this = self.project();

        // 1) one‑time inserts, once the ServiceMap returns `Poll::Ready(None)`,
        //    then the service map is empty
        if let Poll::Ready(Some(change)) = this.initial.as_mut().poll_next(ctx)
        {
            return handle_change(change);
        }

        // 2) live events (removals / re‑inserts)
        match this.events.as_mut().poll_next(ctx) {
            Poll::Ready(Some(change)) => handle_change(change),
            Poll::Pending => Poll::Pending,
            Poll::Ready(None) => Poll::Ready(None),
        }
    }
}

fn handle_change(
    change: Change<Key, DispatcherService>,
) -> Poll<Option<Change<Key, DispatcherService>>> {
    match change {
        Change::Insert(key, service) => {
            tracing::debug!(key = ?key, "Discovered new provider");
            Poll::Ready(Some(Change::Insert(key, service)))
        }
        Change::Remove(key) => {
            tracing::trace!(key = ?key, "Removed provider");
            Poll::Ready(Some(Change::Remove(key)))
        }
    }
}

/// Static service discovery based on a predetermined map of services.
///
/// [`ServiceMap`] is created with an initial map of services. The discovery
/// process will yield this map once and do nothing after.
#[derive(Debug)]
#[pin_project]
struct ServiceMap<K, V> {
    inner: std::collections::hash_map::IntoIter<K, V>,
}

impl<K, V> ServiceMap<K, V>
where
    K: std::hash::Hash + Eq,
{
    pub fn new<Request>(services: HashMap<K, V>) -> ServiceMap<K, V>
    where
        V: tower::Service<Request>,
    {
        ServiceMap {
            inner: services.into_iter(),
        }
    }
}

impl<K, V> Stream for ServiceMap<K, V>
where
    K: std::hash::Hash + Eq + Clone,
{
    type Item = Change<K, V>;

    fn poll_next(
        self: Pin<&mut Self>,
        _: &mut Context<'_>,
    ) -> Poll<Option<Self::Item>> {
        match self.project().inner.next() {
            Some((key, service)) => {
                Poll::Ready(Some(Change::Insert(key, service)))
            }
            None => Poll::Ready(None),
        }
    }
}
