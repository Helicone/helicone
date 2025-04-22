pub mod source;

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
use uuid::Uuid;

use crate::{
    app::AppState,
    error::{
        api::Error, internal::InternalError, invalid_req::InvalidRequestError,
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
            _marker: PhantomData,
        }
    }
}

impl<S, ReqBody> Service<S, ReqBody> {
    pub fn new(inner: S, app_state: AppState) -> Self {
        Self {
            inner,
            app_state,
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
        Box::pin(async move {
            let req_ctx = Arc::new(
                Service::<S, ReqBody>::get_context(app_state, &mut req).await?,
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
        req: &mut Request<ReqBody>,
    ) -> Result<RequestContext, Error> {
        // AuthContext is set by the auth middleware
        let auth_context = req
            .extensions_mut()
            .remove::<AuthContext>()
            .ok_or(InternalError::ExtensionNotFound("AuthContext"))?;
        tracing::info!("hi");
        let path = req.uri().path();
        // TODO: we need to have a layer to normalize request paths like slashes
        // at the end eg remove last slash in https://router.helicone.ai/router/foo123/
        let router_id_path = req
            .uri()
            .path()
            .split('/')
            .nth(2)
            .ok_or(InvalidRequestError::MissingRouterId)?;
        tracing::info!(router_id_path = %router_id_path, "got router id path");

        // Get the parts after the router ID
        let remaining_path = req
            .uri()
            .path()
            .split('/')
            .skip(3) // Skip "", "router", and the router ID
            .collect::<Vec<&str>>()
            .join("/");
        tracing::info!(remaining_path = %remaining_path, "got remaining path");

        let router_id = Uuid::parse_str(router_id_path).map_err(|_| {
            InvalidRequestError::InvalidRouterId(path.to_string())
        })?;
        let mut tx = app_state.0.store.db.begin().await?;
        let router = app_state
            .0
            .store
            .router
            .get_latest_version(&mut tx, router_id)
            .await
            .inspect_err(|e| {
                tracing::error!(error = ?e, "Error getting router");
            })?;
        tracing::debug!(name = %router.name, version = %router.version, "got router");
        // TODO: will likely want to make this into one call/fetch all provider
        // keys at once since we may have multiple
        let provider_api_key = app_state
            .0
            .store
            .provider_keys
            .get_provider_key(
                &mut tx,
                &auth_context.org_id,
                router.config.default_provider,
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
            router.config.default_provider,
            provider_api_key.provider_key,
        )]));

        let target_url = app_state
            .0
            .config
            .dispatcher
            .get_provider_url(router.config.default_provider)?
            .clone();
        tracing::debug!(target_url = %target_url, "got target url");
        // TODO: this will come from parsing the prompt+headers+etc
        let helicone = crate::types::request::HeliconeContext {
            properties: None,
            template_inputs: None,
        };
        let proxy_context = crate::types::request::RequestProxyContext {
            target_url,
            target_provider: router.config.default_provider,
            original_provider: router.config.default_provider,
            original_model: Model::new("gpt4o-mini".to_string(), None),
            target_model: Model::new("gpt4o-mini".to_string(), None),
            provider_api_keys,
        };
        let req_ctx = RequestContext {
            router_config: router.config,
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
    _marker: PhantomData<ReqBody>,
}

impl<ReqBody> Layer<ReqBody> {
    pub fn new(app_state: AppState) -> Self {
        Self {
            app_state,
            _marker: PhantomData,
        }
    }
}

impl<S, ReqBody> tower::Layer<S> for Layer<ReqBody> {
    type Service = Service<S, ReqBody>;

    fn layer(&self, inner: S) -> Self::Service {
        Service::new(inner, self.app_state.clone())
    }
}
