use std::future::poll_fn;

use tokio::sync::mpsc::channel;
use tower::{balance::p2c::{Balance, MakeBalance}, buffer::Buffer, load::PeakEwmaDiscover, BoxError, Service};

use crate::{
    app::AppState,
    discover::{
        Discovery,
        provider::{factory::DiscoverFactory, monitor::ProviderMonitor},
    },
    error::{init::InitError, internal::InternalError},
    types::{request::Request, response::Response},
};

const BUFFER_SIZE: usize = 1024;
const CHANNEL_CAPACITY: usize = 128;

#[derive(Clone)]
pub struct ProviderBalancer {
    pub inner: Buffer<
        Request,
        <Balance<PeakEwmaDiscover<Discovery>, Request> as tower::Service<
            Request,
        >>::Future,
    >,
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
        let inner = Buffer::new(balance, BUFFER_SIZE);
        let provider_monitor = ProviderMonitor::new(tx);
        let provider_balancer = ProviderBalancer { inner };

        Ok((provider_balancer, provider_monitor))
    }
}

impl tower::Service<Request> for ProviderBalancer {
    type Response = Response;
    type Error = BoxError;
    type Future = <Buffer<
        Request,
        <Balance<PeakEwmaDiscover<Discovery>, Request> as tower::Service<
            Request,
        >>::Future,
    > as tower::Service<Request>>::Future;

    fn poll_ready(
        &mut self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        tracing::trace!("ProviderBalancer::poll_ready");
        self.inner
            .poll_ready(cx)
            .map_err(InternalError::PollReadyError)
            .map_err(Into::into)
    }

    fn call(&mut self, req: Request) -> Self::Future {
        tracing::trace!("ProviderBalancer::call");
        self.inner.call(req)
    }
}
