use std::{
    future::{Ready, ready},
    sync::Arc,
    task::{Context, Poll},
};

use chrono::Utc;
use futures::future::Either;
use isocountry::CountryCode;
use uuid::Uuid;

use crate::{
    config::router::RouterConfig,
    error::{api::Error, internal::InternalError},
    types::{
        provider::ProviderKeys,
        request::{AuthContext, Request, RequestContext},
        response::Response,
    },
};

#[derive(Debug, Clone)]
pub struct Service<S> {
    inner: S,
    router_config: Arc<RouterConfig>,
    provider_keys: ProviderKeys,
}

impl<S> Service<S> {
    pub fn new(
        inner: S,
        router_config: Arc<RouterConfig>,
        provider_keys: ProviderKeys,
    ) -> Self {
        Self {
            inner,
            router_config,
            provider_keys,
        }
    }
}

impl<S> tower::Service<Request> for Service<S>
where
    S: tower::Service<Request, Response = Response, Error = Error>
        + Send
        + 'static,
    S::Future: Send + 'static,
{
    type Response = S::Response;
    type Error = Error;
    type Future = Either<Ready<Result<Self::Response, Self::Error>>, S::Future>;

    #[inline]
    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx).map_err(Into::into)
    }

    #[tracing::instrument(level = "debug", name = "request_context", skip_all)]
    fn call(&mut self, mut req: Request) -> Self::Future {
        let router_config = self.router_config.clone();
        let provider_keys = self.provider_keys.clone();
        match Service::<S>::get_context(router_config, provider_keys, &mut req)
        {
            Ok(req_ctx) => {
                req.extensions_mut().insert(Arc::new(req_ctx));
            }
            Err(e) => {
                return Either::Left(ready(Err(e)));
            }
        }
        Either::Right(self.inner.call(req))
    }
}

impl<S> Service<S>
where
    S: tower::Service<Request>,
    S::Future: Send + 'static,
    S::Response: Send + 'static,
    S::Error: Into<Error> + Send + Sync + 'static,
{
    fn get_context(
        router_config: Arc<RouterConfig>,
        provider_api_keys: ProviderKeys,
        req: &mut Request,
    ) -> Result<RequestContext, Error> {
        let auth_context = req
            .extensions_mut()
            .remove::<AuthContext>()
            .ok_or(InternalError::ExtensionNotFound("AuthContext"))?;

        // TODO: this will come from parsing the prompt+headers+etc
        let helicone = crate::types::request::HeliconeContext {
            properties: None,
            template_inputs: None,
        };
        let proxy_context = crate::types::request::RequestProxyContext {
            forced_routing: None,
            provider_api_keys,
        };
        let req_ctx = RequestContext {
            router_config,
            proxy_context,
            helicone,
            auth_context,
            is_stream: false,
            request_id: Uuid::new_v4(),
            country_code: CountryCode::USA,
            start_time: Utc::now(),
        };

        Ok(req_ctx)
    }
}

#[derive(Debug, Clone)]
pub struct Layer {
    router_config: Arc<RouterConfig>,
    provider_keys: ProviderKeys,
}

impl Layer {
    #[must_use]
    pub fn new(
        router_config: Arc<RouterConfig>,
        provider_keys: ProviderKeys,
    ) -> Self {
        Self {
            router_config,
            provider_keys,
        }
    }
}

impl<S> tower::Layer<S> for Layer {
    type Service = Service<S>;

    fn layer(&self, inner: S) -> Self::Service {
        Service::new(
            inner,
            self.router_config.clone(),
            self.provider_keys.clone(),
        )
    }
}
