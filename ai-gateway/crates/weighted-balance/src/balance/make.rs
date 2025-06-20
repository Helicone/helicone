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
use std::{
    fmt,
    future::Future,
    hash::Hash,
    marker::PhantomData,
    pin::Pin,
    task::{Context, Poll},
};

use futures::ready;
use pin_project_lite::pin_project;
use tower::{Service, discover::Discover};

use super::WeightedBalance;
use crate::weight::HasWeight;

/// Constructs load balancers over dynamic service sets produced by a wrapped
/// "inner" service.
///
/// This is effectively an implementation of [`MakeService`] except that it
/// forwards the service descriptors (`Target`) to an inner service (`S`), and
/// expects that service to produce a service set in the form of a [`Discover`].
/// It then wraps the service set in a [`Balance`] before returning it as the
/// "made" service.
///
/// See the [module-level documentation](crate::balance) for details on load
/// balancing.
///
/// [`MakeService`]: crate::MakeService
/// [`Discover`]: crate::discover::Discover
/// [`Balance`]: crate::balance::p2c::Balance
pub struct MakeBalance<S, Req> {
    inner: S,
    _marker: PhantomData<fn(Req)>,
}

pin_project! {
    /// A [`Balance`] in the making.
    ///
    /// [`Balance`]: crate::balance::p2c::Balance
    pub struct MakeFuture<F, Req> {
        #[pin]
        inner: F,
        _marker: PhantomData<fn(Req)>,
    }
}

impl<S, Req> MakeBalance<S, Req> {
    /// Build balancers using operating system entropy.
    pub const fn new(make_discover: S) -> Self {
        Self {
            inner: make_discover,
            _marker: PhantomData,
        }
    }
}

impl<S, Req> Clone for MakeBalance<S, Req>
where
    S: Clone,
{
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
            _marker: PhantomData,
        }
    }
}

impl<S, Target, Req> Service<Target> for MakeBalance<S, Req>
where
    S: Service<Target>,
    S::Response: Discover,
    <S::Response as Discover>::Key: Hash + HasWeight,
    <S::Response as Discover>::Service: Service<Req>,
    <<S::Response as Discover>::Service as Service<Req>>::Error:
        Into<tower::BoxError>,
{
    type Response = WeightedBalance<S::Response, Req>;
    type Error = S::Error;
    type Future = MakeFuture<S::Future, Req>;

    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, target: Target) -> Self::Future {
        MakeFuture {
            inner: self.inner.call(target),
            _marker: PhantomData,
        }
    }
}

impl<S, Req> fmt::Debug for MakeBalance<S, Req>
where
    S: fmt::Debug,
{
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let Self { inner, _marker } = self;
        f.debug_struct("MakeBalance").field("inner", inner).finish()
    }
}

impl<F, T, E, Req> Future for MakeFuture<F, Req>
where
    F: Future<Output = Result<T, E>>,
    T: Discover,
    <T as Discover>::Key: Hash + HasWeight,
    <T as Discover>::Service: Service<Req>,
    <<T as Discover>::Service as Service<Req>>::Error: Into<tower::BoxError>,
{
    type Output = Result<WeightedBalance<T, Req>, E>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let this = self.project();
        let inner = ready!(this.inner.poll(cx))?;
        let svc = WeightedBalance::new(inner);
        Poll::Ready(Ok(svc))
    }
}

impl<F, Req> fmt::Debug for MakeFuture<F, Req>
where
    F: fmt::Debug,
{
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let Self { inner, _marker } = self;
        f.debug_struct("MakeFuture").field("inner", inner).finish()
    }
}
