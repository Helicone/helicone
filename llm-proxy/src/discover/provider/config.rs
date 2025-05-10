use std::{
    collections::HashMap,
    hash::Hash,
    pin::Pin,
    sync::Arc,
    task::{Context, Poll},
};

use futures::Stream;
use nonempty_collections::NESet;
use pin_project::pin_project;
use rust_decimal::prelude::ToPrimitive;
use tokio::sync::mpsc::Receiver;
use tokio_stream::wrappers::ReceiverStream;
use tower::discover::Change;
use weighted_balance::weight::Weight;

use crate::{
    app::AppState,
    config::router::{BalanceTarget, RouterConfig},
    discover::{provider::Key, weighted::WeightedKey},
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
pub struct ConfigDiscovery<K> {
    #[pin]
    initial: ServiceMap<K, DispatcherService>,
    #[pin]
    events: ReceiverStream<Change<K, DispatcherService>>,
}

impl ConfigDiscovery<Key> {
    pub fn new(
        app: &AppState,
        router_config: &Arc<RouterConfig>,
        rx: Receiver<Change<Key, DispatcherService>>,
    ) -> Result<Self, InitError> {
        let events = ReceiverStream::new(rx);
        let mut service_map: HashMap<Key, DispatcherService> = HashMap::new();
        let providers = router_config.balance.providers();
        for provider in providers {
            let key = Key::new(provider);
            let dispatcher =
                Dispatcher::new_with_middleware(app.clone(), key.provider)?;
            service_map.insert(key, dispatcher);
        }

        tracing::debug!("Created config provider discovery");
        Ok(Self {
            initial: ServiceMap::new(service_map),
            events,
        })
    }
}

impl ConfigDiscovery<WeightedKey> {
    pub fn new_weighted(
        app: &AppState,
        weighted_balance_targets: NESet<BalanceTarget>,
        rx: Receiver<Change<WeightedKey, DispatcherService>>,
    ) -> Result<Self, InitError> {
        let events = ReceiverStream::new(rx);
        let mut service_map: HashMap<WeightedKey, DispatcherService> =
            HashMap::new();

        for target in weighted_balance_targets {
            let weight = Weight::from(
                target
                    .weight
                    .to_f64()
                    .ok_or(InitError::InvalidWeight(target.provider))?,
            );
            let key = WeightedKey::new(target.provider, weight);
            let dispatcher =
                Dispatcher::new_with_middleware(app.clone(), key.provider)?;
            service_map.insert(key, dispatcher);
        }

        tracing::debug!("Created config provider discovery");
        Ok(Self {
            initial: ServiceMap::new(service_map),
            events,
        })
    }
}

impl<K> Stream for ConfigDiscovery<K>
where
    K: Hash + Eq + Clone + std::fmt::Debug,
{
    type Item = Change<K, DispatcherService>;

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

fn handle_change<K>(
    change: Change<K, DispatcherService>,
) -> Poll<Option<Change<K, DispatcherService>>>
where
    K: std::fmt::Debug,
{
    match change {
        Change::Insert(key, service) => {
            tracing::debug!(key = ?key, "Discovered new provider");
            Poll::Ready(Some(Change::Insert(key, service)))
        }
        Change::Remove(key) => {
            tracing::debug!(key = ?key, "Removed provider");
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
pub(crate) struct ServiceMap<K, V> {
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
