use std::task::{Context, Poll};

use http::{Request, Response};
use tower::{Layer, Service};
use typed_builder::TypedBuilder;

use super::mapper::registry::EndpointConverterRegistry;
use crate::types::{provider::InferenceProvider, router::RouterId};

/// [`Layer`] to add all required request extensions.
#[derive(Clone, Debug, TypedBuilder)]
pub struct AddExtensionsLayer {
    endpoint_converter_registry: EndpointConverterRegistry,
    inference_provider: InferenceProvider,
    router_id: RouterId,
}

impl<S> Layer<S> for AddExtensionsLayer {
    type Service = AddExtensions<S>;

    fn layer(&self, inner: S) -> Self::Service {
        AddExtensions {
            inner,
            endpoint_converter_registry: self
                .endpoint_converter_registry
                .clone(),
            inference_provider: self.inference_provider,
            router_id: self.router_id,
        }
    }
}

#[derive(Clone, Debug)]
pub struct AddExtensions<S> {
    inner: S,
    endpoint_converter_registry: EndpointConverterRegistry,
    inference_provider: InferenceProvider,
    router_id: RouterId,
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
        req.extensions_mut()
            .insert(self.endpoint_converter_registry.clone());
        req.extensions_mut().insert(self.inference_provider);
        req.extensions_mut().insert(self.router_id);
        self.inner.call(req)
    }
}
