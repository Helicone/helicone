use std::{
    convert::Infallible,
    pin::Pin,
    task::{Context, Poll},
};

pub use axum_core::body::Body;
use bytes::{BufMut, Bytes, BytesMut};
use futures::{Stream, StreamExt};
use hyper::body::{Body as _, Frame, SizeHint};
use tokio::sync::mpsc::{self, UnboundedReceiver};

use crate::error::internal::InternalError;

/// Reads a stream of HTTP data frames as `Bytes` from a channel.
#[derive(Debug)]
pub struct BodyReader {
    rx: UnboundedReceiver<Bytes>,
    is_end_stream: bool,
    size_hint: SizeHint,
    append_newlines: bool,
}

impl BodyReader {
    #[must_use]
    pub fn new(
        rx: UnboundedReceiver<Bytes>,
        size_hint: SizeHint,
        append_newlines: bool,
    ) -> Self {
        Self {
            rx,
            is_end_stream: false,
            size_hint,
            append_newlines,
        }
    }

    /// `append_newlines` is used to support LLM response logging with Helicone
    /// for streaming responses.
    pub fn wrap_stream(
        stream: impl Stream<Item = Result<Bytes, InternalError>> + Send + 'static,
        append_newlines: bool,
    ) -> (axum_core::body::Body, BodyReader) {
        // unbounded channel is okay since we limit memory usage higher in the
        // stack by limiting concurrency and request/response body size.
        let (tx, rx) = mpsc::unbounded_channel();
        let s = stream.map(move |b| {
            match &b {
                Ok(b) => {
                    if let Err(e) = tx.send(b.clone()) {
                        tracing::error!(error = %e, "BodyReader dropped before stream ended");
                    }
                }
                Err(e) => {
                    tracing::error!(error = %e, "BodyReader dropped before stream ended");
                }
            }
            b
        });
        let inner = axum_core::body::Body::from_stream(s);
        let size_hint = inner.size_hint();
        (inner, BodyReader::new(rx, size_hint, append_newlines))
    }
}

impl hyper::body::Body for BodyReader {
    type Data = Bytes;
    type Error = Infallible;

    fn poll_frame(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<Option<Result<Frame<Self::Data>, Self::Error>>> {
        match Pin::new(&mut self.rx).poll_recv(cx) {
            Poll::Ready(Some(bytes)) => {
                if self.append_newlines {
                    let mut new_bytes = BytesMut::from(bytes);
                    new_bytes.put("\n".as_bytes());
                    Poll::Ready(Some(Ok(Frame::data(new_bytes.freeze()))))
                } else {
                    Poll::Ready(Some(Ok(Frame::data(bytes))))
                }
            }
            Poll::Ready(None) => {
                self.is_end_stream = true;
                Poll::Ready(None)
            }
            Poll::Pending => Poll::Pending,
        }
    }

    fn is_end_stream(&self) -> bool {
        self.is_end_stream
    }

    fn size_hint(&self) -> SizeHint {
        self.size_hint.clone()
    }
}
