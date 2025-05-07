//! A [`Load`] implementation which implements weighting on top of an inner
//! [`Load`].
//!
//! This can be useful in such cases as canary deployments, where it is
//! desirable for a particular service to receive less than its fair share of
//! load than other services.

use std::{
    ops,
    pin::Pin,
    task::{Context, Poll},
};

use futures::{Stream, ready};
use pin_project_lite::pin_project;
use tower::{
    Service,
    discover::{Change, Discover},
};

/// A weight on [0.0, ∞].
///
/// Lesser-weighted nodes receive less traffic than heavier-weighted nodes.
///
/// This is represented internally as an integer, rather than a float, so that
/// it can implement `Hash` and `Eq`.
#[derive(Copy, Clone, Debug, PartialEq, PartialOrd, Eq, Ord, Hash)]
pub struct Weight(u32);

impl AsRef<u32> for Weight {
    fn as_ref(&self) -> &u32 {
        &self.0
    }
}

impl Weight {
    /// Minimum Weight
    pub const MIN: Weight = Weight(0);
    /// Unit of Weight - what 1.0_f64 corresponds to
    pub const UNIT: Weight = Weight(10_000);
    /// Maximum Weight
    pub const MAX: Weight = Weight(u32::MAX);
}

impl Default for Weight {
    fn default() -> Self {
        Weight::UNIT
    }
}

impl From<f64> for Weight {
    fn from(w: f64) -> Self {
        if w < 0.0 || w.is_nan() {
            Self::MIN
        } else if w.is_infinite() {
            Self::MAX
        } else {
            Weight((w * (Weight::UNIT.0 as f64)).round() as u32)
        }
    }
}

impl From<Weight> for f64 {
    fn from(w: Weight) -> f64 {
        (w.0 as f64) / (Weight::UNIT.0 as f64)
    }
}

impl ops::Div<Weight> for f64 {
    type Output = f64;

    fn div(self, w: Weight) -> f64 {
        if w == Weight::MIN {
            f64::INFINITY
        } else {
            let w = f64::from(w);
            self / w
        }
    }
}

impl ops::Div<Weight> for usize {
    type Output = f64;

    fn div(self, w: Weight) -> f64 {
        (self as f64) / w
    }
}

/// Measures the load of the underlying service by weighting that service's load
/// by a constant weighting factor.
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Weighted<S> {
    inner: S,
    weight: Weight,
}

impl<S> Weighted<S> {
    /// Wraps an `S`-typed service so that its load is weighted by the given
    /// weight.
    pub fn new<W: Into<Weight>>(inner: S, w: W) -> Self {
        let weight = w.into();
        Self { inner, weight }
    }
}

impl<R, S: Service<R>> Service<R> for Weighted<S> {
    type Response = S::Response;
    type Error = S::Error;
    type Future = S::Future;

    #[inline]
    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    #[inline]
    fn call(&mut self, req: R) -> Self::Future {
        self.inner.call(req)
    }
}

pin_project! {
    /// Wraps a `D`-typed stream of discovered services with [`Weighted`].
    #[derive(Debug)]
    pub struct WeightedDiscover<D>{
        #[pin]
        discover: D,
    }
}

impl<D> WeightedDiscover<D> {
    /// Wraps a [`Discover`], wrapping all of its services with [`Weighted`].
    pub fn new(discover: D) -> Self {
        Self { discover }
    }
}

/// Allows [`Discover::Key`] to expose a weight, so that they can be included in
/// a discover stream
pub trait HasWeight {
    /// Returns the [`Weight`]
    fn weight(&self) -> Weight;
}

impl<T: HasWeight> From<T> for Weighted<T> {
    fn from(inner: T) -> Self {
        let weight = inner.weight();
        Self { inner, weight }
    }
}

impl<T> HasWeight for Weighted<T> {
    fn weight(&self) -> Weight {
        self.weight
    }
}

impl<D> Stream for WeightedDiscover<D>
where
    D: Discover,
    D::Key: HasWeight,
{
    type Item = Result<Change<D::Key, Weighted<D::Service>>, D::Error>;

    fn poll_next(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<Option<Self::Item>> {
        use self::Change::*;

        let this = self.project();
        let change =
            match ready!(this.discover.poll_discover(cx)).transpose()? {
                None => return Poll::Ready(None),
                Some(Insert(k, svc)) => {
                    let w = k.weight();
                    Insert(k, Weighted::new(svc, w))
                }
                Some(Remove(k)) => Remove(k),
            };

        Poll::Ready(Some(Ok(change)))
    }
}

#[test]
fn div_min() {
    assert_eq!(10.0 / Weight::MIN, f64::INFINITY);
    assert_eq!(10 / Weight::MIN, f64::INFINITY);
    assert_eq!(0 / Weight::MIN, f64::INFINITY);
}
