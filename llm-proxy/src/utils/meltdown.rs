use std::{
    panic::AssertUnwindSafe,
    pin::Pin,
    task::{Context, Poll},
};

use futures::{Future, FutureExt, future::CatchUnwind};
use meltdown::{Service, Token};
use pin_project_lite::pin_project;
use tokio::signal::unix::{SignalKind, signal};
use tracing::info;

use crate::error::runtime::RuntimeError;

pin_project! {
    pub struct TaggedFuture<F> {
        tag: &'static str,
        #[pin]
        future: F,
    }
}

impl<F> Future for TaggedFuture<F>
where
    F: Future,
{
    type Output = (&'static str, F::Output);

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let this = self.project();
        this.future.poll(cx).map(|output| (*this.tag, output))
    }
}

pub struct TaggedService<S> {
    tag: &'static str,
    service: S,
}

impl<S> TaggedService<S> {
    pub const fn new(tag: &'static str, service: S) -> Self {
        Self { tag, service }
    }
}

impl<S> Service for TaggedService<S>
where
    S: Service,
{
    type Future = TaggedFuture<S::Future>;

    fn run(self, token: Token) -> Self::Future {
        TaggedFuture {
            tag: self.tag,
            future: self.service.run(token),
        }
    }
}

pub struct CatchPanicService<S> {
    service: S,
}

impl<S> CatchPanicService<S> {
    pub const fn new(service: S) -> Self {
        Self { service }
    }
}

impl<S> Service for CatchPanicService<S>
where
    S: Service,
{
    type Future = CatchUnwind<AssertUnwindSafe<S::Future>>;

    fn run(self, token: Token) -> Self::Future {
        AssertUnwindSafe(self.service.run(token)).catch_unwind()
    }
}

pub async fn wait_for_shutdown_signals(
    mut token: Token,
) -> Result<(), RuntimeError> {
    let mut sigint = signal(SignalKind::interrupt())
        .expect("failed to register SIGINT signal");
    let mut sigterm = signal(SignalKind::terminate())
        .expect("failed to register SIGTERM signal");

    tokio::select! {
        _ = &mut token => {
            info!("Shutdown signal received, starting shutdown");
        },
        _ = sigint.recv() => {
            info!("SIGINT received, starting shutdown");
        },
        _ = sigterm.recv() => {
            info!("SIGTERM received, starting shutdown");
        },
    }

    Ok(())
}
