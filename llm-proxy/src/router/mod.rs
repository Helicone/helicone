pub mod model;
pub mod provider;

use std::time::Duration;

use tower::{
    balance::p2c::Balance, load::{CompleteOnResponse, PeakEwmaDiscover}, BoxError
};

use crate::{
    discover::config::ConfigDiscovery,
    error::internal::InternalError,
    types::{request::Request, response::Response},
};

#[derive(Debug)]
pub struct Router {
    pub inner: Balance<PeakEwmaDiscover<ConfigDiscovery>, Request>,
}

impl Router {
    pub fn new(services: ConfigDiscovery) -> Self {
        // should be configurable
        let discover = PeakEwmaDiscover::new(
            services,
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

impl tower::Service<Request> for Router {
    type Response = Response;
    type Error = BoxError;
    type Future =
        <Balance<PeakEwmaDiscover<ConfigDiscovery>, Request> as tower::Service<
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
