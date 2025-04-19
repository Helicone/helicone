use std::time::Duration;

use tower::{
    BoxError,
    balance::p2c::Balance,
    load::{CompleteOnResponse, PeakEwmaDiscover},
};

use crate::{
    discover::Discovery,
    error::internal::InternalError,
    types::{request::Request, response::Response},
};

#[derive(Debug)]
pub struct ProviderBalancer {
    pub inner: Balance<PeakEwmaDiscover<Discovery>, Request>,
}

impl ProviderBalancer {
    pub async fn new(discovery: Discovery) -> Self {
        // should be configurable
        let discover = PeakEwmaDiscover::new(
            discovery,
            Duration::from_secs(1),
            // 15 mins
            Duration::from_secs(900),
            CompleteOnResponse::default(),
        );
        Self {
            inner: Balance::new(discover),
        }
    }
}

impl tower::Service<Request> for ProviderBalancer {
    type Response = Response;
    type Error = BoxError;
    type Future =
        <Balance<PeakEwmaDiscover<Discovery>, Request> as tower::Service<
            Request,
        >>::Future;

    fn poll_ready(
        &mut self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.inner
            .poll_ready(cx)
            .map_err(InternalError::LoadBalancerError)
            .map_err(Into::into)
    }

    fn call(&mut self, req: Request) -> Self::Future {
        self.inner.call(req)
    }
}

