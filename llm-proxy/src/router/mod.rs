pub mod meta;

use std::{
    convert::Infallible,
    task::{Context, Poll},
};

use tower::ServiceBuilder;

use crate::{
    app::AppState,
    balancer::provider::ProviderBalancer,
    discover::provider::monitor::ProviderMonitor,
    middleware::request_context,
    utils::handle_error::{ErrorHandler, ErrorHandlerLayer},
};

pub type RouterService = ErrorHandler<
    request_context::Service<ProviderBalancer, axum_core::body::Body>,
>;

#[derive(Debug, Clone)]
pub struct Router {
    inner: RouterService,
}

impl Router {
    pub fn new(app_state: AppState) -> (Self, ProviderMonitor) {
        let (balancer, monitor) = ProviderBalancer::new(app_state.clone());
        let service_stack: RouterService = ServiceBuilder::new()
            .layer(ErrorHandlerLayer)
            .layer(crate::middleware::request_context::Layer::<
                axum_core::body::Body,
            >::new(app_state.clone()))
            // other middleware: rate limiting, logging, etc, etc
            // will be added here as well
            // .map_err(|e| crate::error::api::Error::Box(e))
            .service(balancer);

        (
            Self {
                inner: service_stack,
            },
            monitor,
        )
    }
}

impl tower::Service<crate::types::request::Request> for Router {
    type Response = crate::types::response::Response;
    type Error = Infallible;
    type Future = <RouterService as tower::Service<
        crate::types::request::Request,
    >>::Future;

    fn poll_ready(
        &mut self,
        ctx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(ctx)
    }

    fn call(&mut self, req: crate::types::request::Request) -> Self::Future {
        self.inner.call(req)
    }
}
