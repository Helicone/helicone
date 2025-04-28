use std::{
    future::poll_fn,
    task::{Context, Poll},
};

use pin_project_lite::pin_project;
use tokio::sync::mpsc::channel;
use tower::{
    Service,
    balance::p2c::{Balance, MakeBalance},
    load::PeakEwmaDiscover,
};

use crate::{
    app::AppState,
    discover::{
        Discovery,
        provider::{factory::DiscoverFactory, monitor::ProviderMonitor},
    },
    error::{api::Error, init::InitError, internal::InternalError},
    types::{request::Request, response::Response},
};

const CHANNEL_CAPACITY: usize = 128;

pub struct ProviderBalancer {
    pub inner: Balance<PeakEwmaDiscover<Discovery>, Request>,
}

impl std::fmt::Debug for ProviderBalancer {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ProviderBalancer").finish_non_exhaustive()
    }
}

impl ProviderBalancer {
    pub async fn new(
        app_state: AppState,
    ) -> Result<(ProviderBalancer, ProviderMonitor), InitError> {
        let (tx, rx) = channel(CHANNEL_CAPACITY);
        let discover_factory = DiscoverFactory::new(app_state.clone());
        let mut balance_factory = MakeBalance::new(discover_factory);
        let mut balance = balance_factory.call(rx).await?;
        // TODO: do we _have_ to poll_ready here?
        // @tom to double check
        poll_fn(|cx| balance.poll_ready(cx))
            .await
            .map_err(InitError::CreateBalancer)?;
        let provider_monitor = ProviderMonitor::new(tx);
        let provider_balancer = ProviderBalancer { inner: balance };

        Ok((provider_balancer, provider_monitor))
    }
}

impl tower::Service<Request> for ProviderBalancer {
    type Response = Response;
    type Error = Error;
    type Future = ResponseFuture;

    #[inline]
    fn poll_ready(
        &mut self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.inner
            .poll_ready(cx)
            .map_err(InternalError::PollReadyError)
            .map_err(Into::into)
    }

    fn call(&mut self, req: Request) -> Self::Future {
        ResponseFuture {
            future: self.inner.call(req),
        }
    }
}

pin_project! {
    pub struct ResponseFuture {
        #[pin]
        future: <
            Balance<PeakEwmaDiscover<Discovery>, Request> as tower::Service<
                Request,
            >
        >::Future,
    }
}

impl Future for ResponseFuture {
    type Output = Result<Response, Error>;

    fn poll(
        self: std::pin::Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<Self::Output> {
        match self.project().future.poll(cx) {
            Poll::Ready(Ok(res)) => Poll::Ready(Ok(res)),
            Poll::Ready(Err(e)) => Poll::Ready(Err(Error::Internal(
                InternalError::LoadBalancerError(e),
            ))),
            Poll::Pending => Poll::Pending,
        }
    }
}
