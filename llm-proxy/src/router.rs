use std::{
    sync::Arc,
    task::{Context, Poll},
};

use http::Request;
use hyper::body::Body;
use tower::{
    Service,
    steer::{Picker, Steer},
};

use crate::{
    dispatcher::{AiProviderDispatcher, Dispatcher},
    registry::Registry,
    types::request::RequestContext,
};

#[derive(Clone)]
struct RouterPicker;

impl<S, ReqBody> Picker<S, Request<ReqBody>> for RouterPicker
where
    S: AiProviderDispatcher<ReqBody>,
{
    /// Chooses a service index based on the request's `RequestContext`.
    fn pick(&mut self, req: &Request<ReqBody>, services: &[S]) -> usize {
        let context = req.extensions().get::<Arc<RequestContext>>().unwrap();
        let target_provider = context.proxy_context.target_provider;
        let index = services
            .iter()
            .position(|s| s.provider() == target_provider)
            .unwrap();
        index
    }
}

pub struct Router<ReqBody> {
    services: Steer<Dispatcher<ReqBody>, RouterPicker, Request<ReqBody>>,
}

impl<ReqBody> Clone for Router<ReqBody>
where ReqBody: Body + Send + Sync + 'static,
 <ReqBody as hyper::body::Body>::Error: Send + Sync + std::error::Error,
 <ReqBody as hyper::body::Body>::Data: Send + Sync
{
    fn clone(&self) -> Self {
        Self { services: self.services.clone() }
    }
}
impl<ReqBody> Router<ReqBody>
where ReqBody: Body + Send + Sync + 'static,
 <ReqBody as hyper::body::Body>::Error: Send + Sync + std::error::Error,
 <ReqBody as hyper::body::Body>::Data: Send + Sync
{
    pub fn new(registry: Registry<ReqBody>) -> Self {
        Self {
            services: Steer::new(registry.services, RouterPicker),
        }
    }
}

impl<ReqBody> Service<Request<ReqBody>> for Router<ReqBody>
where ReqBody: Body + Send + Sync + 'static,
 <ReqBody as hyper::body::Body>::Error: Send + Sync + std::error::Error,
 <ReqBody as hyper::body::Body>::Data: Send + Sync
{
    type Response = <Dispatcher<ReqBody> as Service<Request<ReqBody>>>::Response;
    type Error = <Dispatcher<ReqBody> as Service<Request<ReqBody>>>::Error;
    type Future = <Dispatcher<ReqBody> as Service<Request<ReqBody>>>::Future;

    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.services.poll_ready(cx)
    }

    fn call(&mut self, req: Request<ReqBody>) -> Self::Future {
        self.services.call(req)
    }
}
