use std::{
    convert::Infallible,
    pin::Pin,
    task::{Context, Poll},
};

use axum_core::response::IntoResponse;
use bytes::Bytes;
use futures::{Stream, StreamExt};
use http::Response;
use hyper::body::{Body as _, Frame, SizeHint};
use tokio::sync::mpsc::{self, UnboundedReceiver};

pub struct Body {
    inner: reqwest::Body,
}

impl Body {
    pub fn wrap_stream(
        stream: impl Stream<Item = Result<Bytes, reqwest::Error>> + Send + 'static,
    ) -> (reqwest::Body, BodyReader) {
        // unbounded channel is okay since we limit memory usage higher in the
        // stack by limiting concurrency and request/response body size.
        let (tx, rx) = mpsc::unbounded_channel();
        let s = stream.map(move |b| {
            if let Ok(b) = &b {
                if let Err(e) = tx.send(b.clone()) {
                    tracing::error!(error = %e, "body channel closed before stream ended");
                }
            }
            b
        });
        let b = reqwest::Body::wrap_stream(s);
        let size_hint = b.size_hint();
        (b, BodyReader::new(rx, size_hint))
    }
}

impl hyper::body::Body for Body {
    type Data = Bytes;
    type Error = reqwest::Error;

    fn poll_frame(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<Option<Result<Frame<Self::Data>, Self::Error>>> {
        Pin::new(&mut self.inner).poll_frame(cx)
    }

    fn is_end_stream(&self) -> bool {
        self.inner.is_end_stream()
    }

    fn size_hint(&self) -> SizeHint {
        self.inner.size_hint()
    }
}

impl IntoResponse for Body {
    fn into_response(self) -> axum_core::response::Response {
        Response::new(axum_core::body::Body::new(self))
    }
}

/// Reads a stream of HTTP data frames as `Bytes` from a channel.
#[derive(Debug)]
pub struct BodyReader {
    rx: UnboundedReceiver<Bytes>,
    is_end_stream: bool,
    size_hint: SizeHint,
}

impl BodyReader {
    #[must_use]
    pub fn new(rx: UnboundedReceiver<Bytes>, size_hint: SizeHint) -> Self {
        Self {
            rx,
            is_end_stream: false,
            size_hint,
        }
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
                Poll::Ready(Some(Ok(Frame::data(bytes))))
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
