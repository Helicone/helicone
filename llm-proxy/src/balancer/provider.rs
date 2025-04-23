use std::time::Duration;

use tokio::sync::mpsc::channel;
use tower::{
    BoxError, balance::p2c::Balance, buffer::Buffer, load::PeakEwmaDiscover,
};

use crate::{
    app::AppState,
    discover::{Discovery, provider::monitor::ProviderMonitor},
    error::{init::InitError, internal::InternalError},
    types::{discover::DiscoverMode, request::Request, response::Response},
};

const BUFFER_SIZE: usize = 1024;
const CHANNEL_CAPACITY: usize = 128;
const DEFAULT_PROVIDER_RTT: Duration = Duration::from_millis(500);

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
    pub fn new(
        app_state: AppState,
    ) -> Result<(ProviderBalancer, ProviderMonitor), InitError> {
        let (tx, rx) = channel(CHANNEL_CAPACITY);
        let discovery = match app_state.0.config.discover.discover_mode {
            // TODO: do we want a separate discover_mode from the deployment
            // target?
            DiscoverMode::Config => Discovery::config(app_state.clone(), rx)?,
        };
        let discover = PeakEwmaDiscover::new(
            discovery,
            DEFAULT_PROVIDER_RTT,
            app_state.0.config.discover.discover_decay,
            Default::default(),
        );

        let inner = Buffer::new(Balance::new(discover), BUFFER_SIZE);
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
        self.inner
            .poll_ready(cx)
            .map_err(InternalError::PollReadyError)
            .map_err(Into::into)
    }

    fn call(&mut self, req: Request) -> Self::Future {
        self.inner.call(req)
    }
}
