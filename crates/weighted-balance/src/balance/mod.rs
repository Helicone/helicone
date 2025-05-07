//! Copyright (c) 2019 Tower Contributors
//!
//! Permission is hereby granted, free of charge, to any
//! person obtaining a copy of this software and associated
//! documentation files (the "Software"), to deal in the
//! Software without restriction, including without
//! limitation the rights to use, copy, modify, merge,
//! publish, distribute, sublicense, and/or sell copies of
//! the Software, and to permit persons to whom the Software
//! is furnished to do so, subject to the following
//! conditions:
//!
//! The above copyright notice and this permission notice
//! shall be included in all copies or substantial portions
//! of the Software.
//!
//! THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//! ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//! TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//! PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
//! SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//! CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
//! OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
//! IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
//! DEALINGS IN THE SOFTWARE.
pub mod make;

use std::{
    fmt,
    hash::Hash,
    marker::PhantomData,
    pin::Pin,
    task::{Context, Poll},
};

use futures::{
    future::{self, TryFutureExt},
    ready,
};
use rand::{SeedableRng, rngs::SmallRng};
use tower::{
    Service,
    discover::{Change, Discover},
    ready_cache::{ReadyCache, error::Failed},
};
use tracing::{debug, trace};

use crate::weight::HasWeight;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("weighted balancer discovery error: {0}")]
    Discover(tower::BoxError),
}

/// Efficiently distributes requests across an arbitrary number of services.
///
/// See the [module-level documentation](..) for details.
///
/// Note that [`WeightedBalance`] requires that the [`Discover`] you use is
/// [`Unpin`] in order to implement [`Service`]. This is because it needs to be
/// accessed from [`Service::poll_ready`], which takes `&mut self`. You can
/// achieve this easily by wrapping your [`Discover`] in [`Box::pin`] before you
/// construct the [`WeightedBalance`] instance. For more details, see [#319].
///
/// [`Box::pin`]: std::boxed::Box::pin()
/// [#319]: https://github.com/tower-rs/tower/issues/319
pub struct WeightedBalance<D, Req>
where
    D: Discover,
    D::Key: Hash + HasWeight,
{
    discover: D,

    services: ReadyCache<D::Key, D::Service, Req>,
    ready_index: Option<usize>,

    rng: SmallRng,

    _req: PhantomData<Req>,
}

impl<D: Discover, Req> fmt::Debug for WeightedBalance<D, Req>
where
    D: fmt::Debug,
    D::Key: Hash + HasWeight + fmt::Debug,
    D::Service: fmt::Debug,
{
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("WeightedBalance")
            .field("discover", &self.discover)
            .field("services", &self.services)
            .finish()
    }
}

impl<D, Req> WeightedBalance<D, Req>
where
    D: Discover,
    D::Key: Hash + HasWeight,
    D::Service: Service<Req>,
    <D::Service as Service<Req>>::Error: Into<tower::BoxError>,
{
    pub fn new(discover: D) -> Self {
        tracing::trace!("WeightedBalance::new");
        Self {
            rng: SmallRng::from_rng(&mut rand::rng()),
            discover,
            services: ReadyCache::default(),
            ready_index: None,

            _req: PhantomData,
        }
    }

    /// Returns the number of endpoints currently tracked by the balancer.
    pub fn len(&self) -> usize {
        self.services.len()
    }

    /// Returns whether or not the balancer is empty.
    pub fn is_empty(&self) -> bool {
        self.services.is_empty()
    }
}

impl<D, Req> WeightedBalance<D, Req>
where
    D: Discover + Unpin,
    D::Key: Hash + Clone + HasWeight,
    D::Error: Into<tower::BoxError>,
    D::Service: Service<Req>,
    <D::Service as Service<Req>>::Error: Into<tower::BoxError>,
{
    /// Polls `discover` for updates, adding new items to `not_ready`.
    ///
    /// Removals may alter the order of either `ready` or `not_ready`.
    fn update_pending_from_discover(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Option<Result<(), Error>>> {
        debug!("updating from discover");
        loop {
            match ready!(Pin::new(&mut self.discover).poll_discover(cx))
                .transpose()
                .map_err(|e| Error::Discover(e.into()))?
            {
                None => return Poll::Ready(None),
                Some(Change::Remove(key)) => {
                    trace!("remove");
                    self.services.evict(&key);
                }
                Some(Change::Insert(key, svc)) => {
                    trace!("insert");
                    // If this service already existed in the set, it will be
                    // replaced as the new one becomes ready.
                    self.services.push(key, svc);
                }
            }
        }
    }

    fn promote_pending_to_ready(&mut self, cx: &mut Context<'_>) {
        loop {
            match self.services.poll_pending(cx) {
                Poll::Ready(Ok(())) => {
                    // There are no remaining pending services.
                    debug_assert_eq!(self.services.pending_len(), 0);
                    break;
                }
                Poll::Pending => {
                    // None of the pending services are ready.
                    debug_assert!(self.services.pending_len() > 0);
                    break;
                }
                Poll::Ready(Err(error)) => {
                    // An individual service was lost; continue processing
                    // pending services.
                    debug!(%error, "dropping failed endpoint");
                }
            }
        }
        trace!(
            ready = %self.services.ready_len(),
            pending = %self.services.pending_len(),
            "poll_unready"
        );
    }

    fn ready_index(&mut self) -> Option<usize> {
        match self.services.ready_len() {
            0 => None,
            1 => Some(0),
            len => {
                // todo: remove unwraps
                let sample_fn = |idx| {
                    let (key, _service) = self
                        .services
                        .get_ready_index(idx)
                        .expect("invalid index");
                    let weight = key.weight();
                    tracing::trace!(weight = ?weight, idx = %idx, "sampling weight");
                    weight
                };
                // TODO: decide ideal impl, remove unwrap
                // alternatively we could use rand::distributions::WeightedIndex
                let sample = rand::seq::index::sample_weighted(
                    &mut self.rng,
                    len,
                    sample_fn,
                    1,
                )
                .unwrap();
                let chosen = sample.index(0);

                trace!(chosen = chosen, "p2c",);
                Some(chosen as usize)
            }
        }
    }
}

impl<D, Req> Service<Req> for WeightedBalance<D, Req>
where
    D: Discover + Unpin,
    D::Key: Hash + Clone + HasWeight,
    D::Error: Into<tower::BoxError>,
    D::Service: Service<Req>,
    <D::Service as Service<Req>>::Error: Into<tower::BoxError>,
{
    type Response = <D::Service as Service<Req>>::Response;
    type Error = tower::BoxError;
    type Future = future::MapErr<
        <D::Service as Service<Req>>::Future,
        fn(<D::Service as Service<Req>>::Error) -> tower::BoxError,
    >;

    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        tracing::trace!("WeightedBalance::poll_ready");
        // `ready_index` may have already been set by a prior invocation. These
        // updates cannot disturb the order of existing ready services.
        let _ = self.update_pending_from_discover(cx)?;
        self.promote_pending_to_ready(cx);

        loop {
            // If a service has already been selected, ensure that it is ready.
            // This ensures that the underlying service is ready immediately
            // before a request is dispatched to it (i.e. in the same task
            // invocation). If, e.g., a failure detector has changed the state
            // of the service, it may be evicted from the ready set so that
            // another service can be selected.
            if let Some(index) = self.ready_index.take() {
                match self.services.check_ready_index(cx, index) {
                    Ok(true) => {
                        // The service remains ready.
                        self.ready_index = Some(index);
                        return Poll::Ready(Ok(()));
                    }
                    Ok(false) => {
                        // The service is no longer ready. Try to find a new
                        // one.
                        trace!("ready service became unavailable");
                    }
                    Err(Failed(_, error)) => {
                        // The ready endpoint failed, so log the error and try
                        // to find a new one.
                        debug!(%error, "endpoint failed");
                    }
                }
            }

            self.ready_index = self.ready_index();
            if self.ready_index.is_none() {
                debug_assert_eq!(self.services.ready_len(), 0);
                // We have previously registered interest in updates from
                // discover and pending services.
                return Poll::Pending;
            }
        }
    }

    fn call(&mut self, request: Req) -> Self::Future {
        tracing::trace!("WeightedBalance::call");
        let index = self.ready_index.take().expect("called before ready");
        self.services
            .call_ready_index(index, request)
            .map_err(Into::into)
    }
}
