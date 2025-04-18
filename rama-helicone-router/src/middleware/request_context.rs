use std::{sync::Arc, time::Instant};

use indexmap::IndexMap;
use isocountry::CountryCode;
use rama::http::Request;
use uuid::Uuid;

use crate::{
    app::{AppState, Context},
    error::{
        api::{Error, InvalidRequestError},
        internal::InternalError,
    },
    types::{
        provider::ProviderKeys,
        request::{AuthContext, RequestContext},
    },
};

#[derive(Debug, Clone)]
pub struct Service<S> {
    inner: S,
}

impl<S> Service<S> {
    pub fn new(inner: S) -> Self {
        Self { inner }
    }
}

impl<S> rama::Service<AppState, Request> for Service<S>
where
    S: rama::Service<AppState, Request> + Clone + Send + Sync + 'static,
    S::Error: Into<Error> + Send + Sync + 'static,
{
    type Response = S::Response;
    type Error = Error;

    #[tracing::instrument(skip_all)]
    fn serve(
        &self,
        mut ctx: Context,
        mut req: Request,
    ) -> impl futures::Future<Output = Result<Self::Response, Self::Error>> + Send
    {
        tracing::info!("Dispatcher::serve");
        let this = self.clone();
        tracing::debug!(uri = %req.uri(), headers = ?req.headers(), "Received request");
        async move {
            let req_ctx = Arc::new(this.get_context(&mut ctx, &mut req).await?);
            ctx.insert(req_ctx);
            this.inner.serve(ctx, req).await.map_err(Into::into)
        }
    }
}

impl<S> Service<S>
where
    S: rama::Service<AppState, Request> + Clone,
    S::Error: Into<Error> + Send + Sync + 'static,
{
    async fn get_context(
        &self,
        ctx: &mut Context,
        req: &mut Request,
    ) -> Result<RequestContext, Error> {
        // AuthContext is set by the auth middleware
        let auth_context = ctx.remove::<AuthContext>().ok_or(InternalError::ExtensionNotFound("AuthContext"))?;
        let app_state = ctx.state();
        // TODO: we need to have a layer to normalize request paths like slashes
        // at the end eg remove last slash in https://router.helicone.ai/router/foo123/
        let router_id_path = req
            .uri()
            .path()
            .split('/')
            .nth(2)
            .ok_or(InvalidRequestError::MissingRouterId)?;
        tracing::info!(router_id_path = %router_id_path, "got router id");
        let router_id = Uuid::parse_str(router_id_path)
            .map_err(InvalidRequestError::InvalidRouterId)?;
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

        // TODO: this will come from parsing the prompt+headers+etc
        let helicone = crate::types::request::HeliconeContext {
            properties: None,
            template_inputs: None,
        };
        let proxy_context = crate::types::request::RequestProxyContext {
            target_provider: router.config.default_provider,
            original_provider: router.config.default_provider,
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
pub struct Layer;

impl<S> rama::Layer<S> for Layer
where
    S: rama::Service<AppState, Request> + Clone,
    S::Error: Into<Error> + Send + Sync + 'static,
{
    type Service = Service<S>;

    fn layer(&self, inner: S) -> Self::Service {
        Service::new(inner)
    }
}
