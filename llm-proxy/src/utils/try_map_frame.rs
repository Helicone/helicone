use std::{
    any::type_name,
    error::Error as StdError,
    fmt,
    pin::Pin,
    task::{Context, Poll},
};

use bytes::Buf;
use http_body::{Body, Frame};
use pin_project_lite::pin_project;

/// Error type for `TryMapFrame` body.
///
/// Combines errors from the underlying body (`BodyError`) and the mapping
/// closure (`ClosureError`).
#[derive(Debug)]
pub enum TryMapFrameError<BodyError, ClosureError> {
    /// An error from the underlying body.
    Body(BodyError),
    /// An error from the mapping closure.
    Closure(ClosureError),
}

impl<BodyError, ClosureError> fmt::Display
    for TryMapFrameError<BodyError, ClosureError>
where
    BodyError: fmt::Display,
    ClosureError: fmt::Display,
{
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TryMapFrameError::Body(err) => write!(f, "Body error: {err}"),
            TryMapFrameError::Closure(err) => {
                write!(f, "Closure error: {err}")
            }
        }
    }
}

impl<BodyError, ClosureError> StdError
    for TryMapFrameError<BodyError, ClosureError>
where
    BodyError: StdError + 'static,
    ClosureError: StdError + 'static,
{
    fn source(&self) -> Option<&(dyn StdError + 'static)> {
        match self {
            TryMapFrameError::Body(err) => Some(err),
            TryMapFrameError::Closure(err) => Some(err),
        }
    }
}

pin_project! {
    /// Body returned by the `try_map_frame` combinator.
    /// Allows a mapping function that can fail.
    pub struct TryMapFrame<B, F, E> {
        #[pin]
        inner: B,
        f: F,
        _phantom_error: std::marker::PhantomData<E>,
    }
}

// F: FnMut(http_body::Frame<Self::Data>) -> http_body::Frame<B>,
impl<B, F, E> TryMapFrame<B, F, E> {
    #[inline]
    #[allow(dead_code)]
    pub(crate) fn new(body: B, f: F) -> Self {
        Self {
            inner: body,
            f,
            _phantom_error: std::marker::PhantomData,
        }
    }

    /// Get a reference to the inner body.
    pub fn get_ref(&self) -> &B {
        &self.inner
    }

    /// Get a mutable reference to the inner body.
    pub fn get_mut(&mut self) -> &mut B {
        &mut self.inner
    }

    /// Get a pinned mutable reference to the inner body.
    #[must_use]
    pub fn get_pin_mut(self: Pin<&mut Self>) -> Pin<&mut B> {
        self.project().inner
    }

    /// Consume `self`, returning the inner body.
    pub fn into_inner(self) -> B {
        self.inner
    }
}

impl<B, F, E> Clone for TryMapFrame<B, F, E>
where
    B: Clone,
    F: Clone,
{
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
            f: self.f.clone(),
            _phantom_error: std::marker::PhantomData,
        }
    }
}

impl<B, F, E, B2> Body for TryMapFrame<B, F, E>
where
    B: Body,
    F: FnMut(Frame<B::Data>) -> Result<Option<Frame<B2>>, E>,
    B2: Buf,
    // E is the error type from the closure
{
    type Data = B2;
    type Error = TryMapFrameError<B::Error, E>;

    fn poll_frame(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<Option<Result<Frame<Self::Data>, Self::Error>>> {
        let this = self.project();
        match this.inner.poll_frame(cx) {
            Poll::Pending => Poll::Pending,
            Poll::Ready(None) => Poll::Ready(None),
            Poll::Ready(Some(Ok(frame))) => match (this.f)(frame) {
                Ok(Some(mapped_frame)) => Poll::Ready(Some(Ok(mapped_frame))),
                Ok(None) => Poll::Ready(None),
                Err(closure_err) => Poll::Ready(Some(Err(
                    TryMapFrameError::Closure(closure_err),
                ))),
            },
            Poll::Ready(Some(Err(body_err))) => {
                Poll::Ready(Some(Err(TryMapFrameError::Body(body_err))))
            }
        }
    }

    fn is_end_stream(&self) -> bool {
        self.inner.is_end_stream()
    }
}

impl<B, F, E> fmt::Debug for TryMapFrame<B, F, E>
where
    B: fmt::Debug,
{
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.debug_struct("TryMapFrame")
            .field("inner", &self.inner)
            .field("f", &type_name::<F>())
            .finish()
    }
}
