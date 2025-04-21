use std::time::Duration;

use tower::{BoxError, balance::p2c::Balance, load::PeakEwmaDiscover};

use crate::{
    discover::ProviderDiscovery,
    error::internal::InternalError,
    types::{request::Request, response::Response},
};

pub struct ProviderBalancer {
    pub inner: Balance<PeakEwmaDiscover<ProviderDiscovery>, Request>,
}

impl std::fmt::Debug for ProviderBalancer {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ProviderBalancer").finish_non_exhaustive()
    }
}

impl ProviderBalancer {
    pub fn new(discovery: ProviderDiscovery) -> ProviderBalancer {
        let discover = PeakEwmaDiscover::new(
            discovery,
            Duration::from_secs(1),
            Duration::from_secs(900),
            Default::default(),
        );

        ProviderBalancer {
            inner: Balance::new(discover),
        }
    }
}

impl tower::Service<Request> for ProviderBalancer {
    type Response = Response;
    type Error = BoxError;
    type Future = <Balance<PeakEwmaDiscover<ProviderDiscovery>, Request> as tower::Service<
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
