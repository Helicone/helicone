use std::{
    pin::Pin,
    task::{Context, Poll},
    time::Duration,
};

use futures::ready;
use pin_project_lite::pin_project;
use tokio::{
    sync::oneshot::{self, error::RecvError},
    time::Instant,
};

pin_project! {
    pub struct TFFTFuture {
        start_time: Instant,
        #[pin]
        tfft_rx: oneshot::Receiver<()>,
    }
}

impl TFFTFuture {
    #[must_use]
    pub fn new(start_time: Instant, tfft_rx: oneshot::Receiver<()>) -> Self {
        Self {
            start_time,
            tfft_rx,
        }
    }
}

impl Future for TFFTFuture {
    type Output = Result<Duration, RecvError>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let this = self.project();
        match ready!(this.tfft_rx.poll(cx)) {
            Ok(()) => Poll::Ready(Ok(this.start_time.elapsed())),
            Err(e) => Poll::Ready(Err(e)),
        }
    }
}
