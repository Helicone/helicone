use std::{
    collections::HashMap,
    convert::Infallible,
    pin::Pin,
    task::{Context, Poll},
    time::Duration,
};

use futures::Stream;
use pin_project::pin_project;
use reqwest::{Client, Proxy};
use tokio::sync::mpsc::Receiver;
use tokio_stream::wrappers::ReceiverStream;
use tower::discover::Change;

use crate::{
    app::AppState,
    discover::Key,
    dispatcher::{Dispatcher, DispatcherService},
    error::init::InitError,
};

const CONNECTION_TIMEOUT: Duration = Duration::from_secs(5);

/// Reads available models and providers from the config file.
///
/// We can additionally dynamically remove providers from the balancer
/// if they hit certain failure thresholds by using a layer like:
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
        rx: Receiver<Change<Key, DispatcherService>>,
    ) -> Result<Self, InitError> {
        let events = ReceiverStream::new(rx);
        let mut service_map: HashMap<Key, DispatcherService> = HashMap::new();
        for (provider, provider_config) in
            app.0.config.discover.providers.iter()
        {
            let key = Key::new(provider.clone());
            let proxy = Proxy::all(provider_config.base_url.clone())
                .map_err(InitError::CreateProxyClient)?;
            let http_client = Client::builder()
                .connect_timeout(CONNECTION_TIMEOUT)
                .proxy(proxy)
                .build()
                .map_err(InitError::CreateProxyClient)?;
            let dispatcher = Dispatcher::new_with_middleware(
                http_client,
                app.clone(),
                provider.clone(),
            );
            service_map.insert(key.clone(), dispatcher);
        }
        tracing::trace!(service_map_len = %service_map.len(), "creating config discovery");

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
        tracing::trace!("ConfigDiscovery::poll_next");
        let mut this = self.project();

        // --- Loop to check initial stream first ---
        // We prioritize draining the initial set of services from the config.
        // PeakEwmaDiscover will call poll_next repeatedly until it gets Pending
        // or None.
        match this.initial.as_mut().poll_next(ctx) {
            Poll::Ready(Some(Ok(change))) => {
                // Found an initial item, handle and return it immediately.
                tracing::trace!("yielding initial stream item");
                return handle_change(change);
            }
            Poll::Ready(None) => {
                // Initial stream is exhausted, fall through to poll events.
                tracing::trace!("initial stream ended, polling events");
            }
            Poll::Pending => {
                // Should not happen with ServiceMap, but handle
                // defensively.
                tracing::trace!("initial stream pending");
                return Poll::Pending;
            }
            Poll::Ready(Some(Err(e))) => {
                // ServiceMap yields Infallible
                tracing::error!(error = %e, "Error polling initial stream");
                // Treat error as pending for recovery
                return Poll::Pending;
            }
        }

        // --- Initial stream is done, poll live events ---
        match this.events.as_mut().poll_next(ctx) {
            Poll::Ready(Some(change)) => {
                tracing::trace!("yielding live event stream item");
                handle_change(change)
            }
            Poll::Pending => {
                tracing::trace!("live event stream pending");
                Poll::Pending
            }
            Poll::Ready(None) => {
                tracing::trace!("live event stream ended");
                Poll::Ready(None) // End of combined stream
            }
        }
    }
}

fn handle_change(
    change: Change<Key, DispatcherService>,
) -> Poll<Option<Change<Key, DispatcherService>>> {
    match change {
        Change::Insert(key, service) => {
            tracing::trace!(key = ?key, "Discovered new provider");
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
    type Item = Result<Change<K, V>, Infallible>;

    fn poll_next(
        self: Pin<&mut Self>,
        _: &mut Context<'_>,
    ) -> Poll<Option<Self::Item>> {
        match self.project().inner.next() {
            Some((key, service)) => {
                Poll::Ready(Some(Ok(Change::Insert(key, service))))
            }
            None => Poll::Ready(None),
        }
    }
}
