pub mod model;
pub mod provider;

use std::{
    sync::Arc,
    task::{Context, Poll},
};

use tower::{
    Service,
    steer::{Picker, Steer},
};

use crate::{
    dispatcher::{AiProviderDispatcher, Dispatcher},
    registry::Registry,
    types::request::{Request, RequestContext},
};

#[derive(Clone)]
struct RouterPicker;

impl<S> Picker<S, Request> for RouterPicker
where
    S: AiProviderDispatcher,
{
    /// Chooses a service index based on the request's `RequestContext`.
    fn pick(&mut self, req: &Request, services: &[S]) -> usize {
        let context = req.extensions().get::<Arc<RequestContext>>().unwrap();
        let target_provider = context.proxy_context.target_provider;
        let index = services
            .iter()
            .position(|s| s.provider() == target_provider)
            .unwrap();
        index
    }
}

pub struct Router {
    services: Steer<Dispatcher, RouterPicker, Request>,
}

impl Clone for Router {
    fn clone(&self) -> Self {
        Self {
            services: self.services.clone(),
        }
    }
}
impl Router {
    pub fn new(registry: Registry) -> Self {
        Self {
            services: Steer::new(registry.services, RouterPicker),
        }
    }
}

impl Service<Request> for Router {
    type Response = <Dispatcher as Service<Request>>::Response;
    type Error = <Dispatcher as Service<Request>>::Error;
    type Future = <Dispatcher as Service<Request>>::Future;

    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.services.poll_ready(cx)
    }

    fn call(&mut self, req: Request) -> Self::Future {
        self.services.call(req)
    }
}
