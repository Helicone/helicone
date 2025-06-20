use std::{
    future::Future,
    pin::Pin,
    task::{Context, Poll},
};

use pin_project_lite::pin_project;
use rustc_hash::FxHashMap as HashMap;
use tokio::sync::{
    RwLock,
    mpsc::{Receiver, Sender},
};

use crate::{endpoints::ApiEndpoint, types::router::RouterId};

pub type RateLimitEventSenders =
    RwLock<HashMap<RouterId, Sender<RateLimitEvent>>>;
pub type RateLimitEventReceivers =
    RwLock<HashMap<RouterId, Receiver<RateLimitEvent>>>;

#[derive(Debug, Clone, Copy)]
pub struct RateLimitEvent {
    pub api_endpoint: ApiEndpoint,
    pub retry_after_seconds: Option<u64>,
}

impl RateLimitEvent {
    #[must_use]
    pub fn new(
        api_endpoint: ApiEndpoint,
        retry_after_seconds: Option<u64>,
    ) -> Self {
        Self {
            api_endpoint,
            retry_after_seconds,
        }
    }
}

pin_project! {
    pub struct ProviderRestore<K> {
        pub key: Option<K>,
        pub api_endpoint: ApiEndpoint,
        #[pin]
        pub timer: tokio::time::Sleep,
    }
}

impl<K> Future for ProviderRestore<K> {
    type Output = (K, ApiEndpoint);

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let this = self.project();

        match this.timer.poll(cx) {
            Poll::Ready(()) => Poll::Ready((
                this.key.take().expect(
                    "should never poll future after restore completion",
                ),
                *this.api_endpoint,
            )),
            Poll::Pending => Poll::Pending,
        }
    }
}
