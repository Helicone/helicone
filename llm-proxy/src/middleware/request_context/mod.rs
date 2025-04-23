use std::{
    marker::PhantomData,
    sync::Arc,
    task::{Context, Poll},
    time::Instant,
};

use futures::future::BoxFuture;
use http::Request;
use indexmap::IndexMap;
use isocountry::CountryCode;

use crate::{
    app::AppState,
    config::router::RouterConfig,
    error::{
        api::Error, internal::InternalError,
    },
    types::{
        model::Model,
        provider::ProviderKeys,
        request::{AuthContext, RequestContext},
    },
};

#[derive(Debug)]
pub struct Service<S, ReqBody> {
    inner: S,
    app_state: AppState,
    router_config: Arc<RouterConfig>,
    _marker: PhantomData<ReqBody>,
}

/// A manual impl of Clone since the derived version will add a Clone bound on
/// the ReqBody type, which isn't needed since it's just used as a marker type.
impl<S, ReqBody> Clone for Service<S, ReqBody>
where
    S: Clone,
{
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
            app_state: self.app_state.clone(),
            router_config: self.router_config.clone(),
            _marker: PhantomData,
        }
    }
}

impl<S, ReqBody> Service<S, ReqBody> {
    pub fn new(
        inner: S,
        app_state: AppState,
        router_config: Arc<RouterConfig>,
    ) -> Self {
        Self {
            inner,
            app_state,
            router_config,
            _marker: PhantomData,
        }
    }
}

impl<S, ReqBody> tower::Service<Request<ReqBody>> for Service<S, ReqBody>
where
    S: tower::Service<Request<ReqBody>> + Clone + Send + 'static,
    S::Future: Send + 'static,
    S::Response: Send + 'static,
    S::Error: Into<Error> + Send + Sync + 'static,
    ReqBody: Send + 'static,
{
    type Response = S::Response;
    type Error = Error;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx).map_err(Into::into)
    }

    #[tracing::instrument(
        name = "RequestContextService::call",
        skip(self, req)
    )]
    fn call(&mut self, mut req: Request<ReqBody>) -> Self::Future {
        tracing::info!("RequestContextService::call");
        let mut this = self.clone();
        let app_state = this.app_state.clone();
        let router_config = this.router_config.clone();
        Box::pin(async move {
            let req_ctx = Arc::new(
                Service::<S, ReqBody>::get_context(
                    app_state,
                    router_config,
                    &mut req,
                )
                .await?,
            );
            req.extensions_mut().insert(req_ctx);
            this.inner.call(req).await.map_err(Into::into)
        })
    }
}

impl<S, ReqBody> Service<S, ReqBody>
where
    S: tower::Service<Request<ReqBody>> + Clone,
    S::Future: Send + 'static,
    S::Response: Send + 'static,
    S::Error: Into<Error> + Send + Sync + 'static,
{
    async fn get_context(
        app_state: AppState,
        router_config: Arc<RouterConfig>,
        req: &mut Request<ReqBody>,
    ) -> Result<RequestContext, Error> {
        let auth_context = req
            .extensions_mut()
            .remove::<AuthContext>()
            .ok_or(InternalError::ExtensionNotFound("AuthContext"))?;
        tracing::info!("hi");
        let mut tx = app_state.0.store.db.begin().await?;
        // TODO: will likely want to make this into one call/fetch all provider
        // keys at once since we may have multiple
        let provider_api_key = app_state
            .0
            .store
            .provider_keys
            .get_provider_key(
                &mut tx,
                &auth_context.org_id,
                router_config.default_provider,
            )
            .await
            .inspect_err(|e| {
                tracing::error!(error = ?e, "Error getting provider key");
            })?;
        tracing::debug!(
            provider = %provider_api_key.provider_name,
            "got provider key"
        );
        let provider_api_keys = ProviderKeys::new(IndexMap::from_iter([(
            router_config.default_provider,
            provider_api_key.provider_key,
        )]));

        let target_url = app_state
            .0
            .config
            .discover
            .providers
            .get(&router_config.default_provider)
            .ok_or(InternalError::ProviderNotConfigured(router_config.default_provider))?
            .base_url
            .clone();
        tracing::debug!(target_url = %target_url, "got target url");
        // TODO: this will come from parsing the prompt+headers+etc
        let helicone = crate::types::request::HeliconeContext {
            properties: None,
            template_inputs: None,
        };
        let proxy_context = crate::types::request::RequestProxyContext {
            target_url,
            target_provider: router_config.default_provider,
            original_provider: router_config.default_provider,
            original_model: Model::new("gpt4o-mini".to_string(), None),
            target_model: Model::new("gpt4o-mini".to_string(), None),
            provider_api_keys,
        };
        let req_ctx = RequestContext {
            router_config,
            proxy_context,
            helicone,
            auth_context,
            is_stream: false,
            request_id: "test-request-id".to_string(),
            country_code: CountryCode::USA,
            start_time: Instant::now(),
        };

        Ok(req_ctx)
    }
}

#[derive(Debug, Clone)]
pub struct Layer<ReqBody> {
    app_state: AppState,
    router_config: Arc<RouterConfig>,
    _marker: PhantomData<ReqBody>,
}

impl<ReqBody> Layer<ReqBody> {
    pub fn new(app_state: AppState, router_config: Arc<RouterConfig>) -> Self {
        Self {
            app_state,
            router_config,
            _marker: PhantomData,
        }
    }
}

impl<S, ReqBody> tower::Layer<S> for Layer<ReqBody> {
    type Service = Service<S, ReqBody>;

    fn layer(&self, inner: S) -> Self::Service {
        Service::new(inner, self.app_state.clone(), self.router_config.clone())
    }
}
