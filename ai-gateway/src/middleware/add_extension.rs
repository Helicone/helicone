use std::task::{Context, Poll};

use http::{Request, Response};
use tower::{Layer, Service};
use typed_builder::TypedBuilder;

use crate::types::{provider::InferenceProvider, router::RouterId};

/// [`Layer`] to add all required request extensions.
#[derive(Clone, Debug, TypedBuilder)]
pub struct AddExtensionsLayer {
    inference_provider: InferenceProvider,
    router_id: Option<RouterId>,
}

impl<S> Layer<S> for AddExtensionsLayer {
    type Service = AddExtensions<S>;

    fn layer(&self, inner: S) -> Self::Service {
        AddExtensions {
            inner,
            inference_provider: self.inference_provider,
            router_id: self.router_id.clone(),
        }
    }
}

#[derive(Clone, Debug)]
pub struct AddExtensions<S> {
    inner: S,
    inference_provider: InferenceProvider,
    router_id: Option<RouterId>,
}

impl<ResBody, ReqBody, S> Service<Request<ReqBody>> for AddExtensions<S>
where
    S: Service<Request<ReqBody>, Response = Response<ResBody>>,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = S::Future;

    #[inline]
    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, mut req: Request<ReqBody>) -> Self::Future {
        req.extensions_mut().insert(self.inference_provider);
        if let Some(router_id) = self.router_id.clone() {
            req.extensions_mut().insert(router_id);
        }
        self.inner.call(req)
    }
}
