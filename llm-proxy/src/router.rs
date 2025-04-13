use std::{
    sync::Arc,
    task::{Context, Poll},
};

use http::Request;
use tower::{
    Service,
    steer::{Picker, Steer},
};

use crate::{
    dispatcher::{AiProviderDispatcher, Dispatcher, ReqBody as Body},
    registry::Registry,
    types::request::RequestContext,
};

#[derive(Clone)]
struct RouterPicker;

impl<S> Picker<S, Request<Body>> for RouterPicker
where
    S: AiProviderDispatcher,
{
    /// Chooses a service index based on the request's `RequestContext`.
    fn pick(&mut self, req: &Request<Body>, services: &[S]) -> usize {
        let context = req.extensions().get::<Arc<RequestContext>>().unwrap();
        let target_provider = context.proxy_context.target_provider;
        let index = services
            .iter()
            .position(|s| s.provider() == target_provider)
            .unwrap();
        index
    }
}

#[derive(Clone)]
pub struct Router {
    services: Steer<Dispatcher, RouterPicker, Request<Body>>,
}

impl Router {
    pub fn new(registry: Registry) -> Self {
        Self {
            services: Steer::new(registry.services, RouterPicker),
        }
    }
}

impl Service<Request<Body>> for Router {
    type Response = <Dispatcher as Service<Request<Body>>>::Response;
    type Error = <Dispatcher as Service<Request<Body>>>::Error;
    type Future = <Dispatcher as Service<Request<Body>>>::Future;

    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.services.poll_ready(cx)
    }

    fn call(&mut self, req: Request<Body>) -> Self::Future {
        self.services.call(req)
    }
}
