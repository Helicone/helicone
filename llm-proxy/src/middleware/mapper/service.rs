//! Middleware for mapping requests to the correct provider.
//! 
//! Just a note on how we detect the request style of the request:
//! 
//! For the following use case:
//!
//! ```python
//! # foobar-ai-sdk is _any_ hypothetical AI sdk,
//! # may have its own request format, urls, etc
//! from foobar-ai-sdk import FoobarAI
//!
//! client = FoobarAI(
//!   base_url="https://localhost:8080/router",
//!   api_key="<HELICONE_API_KEY>",
//! )
//! ```
//!
//! and the user wants to use that SDK to always proxy a given provider,
//! e.g. `anthropic`, then we need to disambiguate the provider of the request.
//!
//! There are two ways to do this:
//!
//! 1. We attempt to detect the request style (body format, url, etc) of the request.
//!    When providers provide matching URLs, this can get somewhat complex quickly.
//!    E.g. `/v1/chat/completions` is the same for openai and mistral, but
//!    `/v1/messages` is unique to Anthropic so we would know a request with that 
//!    format may come from the anthropic sdk and thus use the anthropic request body
//!    format. The router config for this would look like:
//!
//! ```yaml
//! providers:
//!   - anthropic
//! ```
//!
//! 2. We force the user to separately configure the request style from the list
//!    of providers that the request will be proxied to, e.g.
//!
//! ```yaml
//! request-style: openai
//! providers:
//!   - anthropic
//! ```
//!
//! In this case, we concretely know upfront what request style the user wants,
//! and how to map URLs with much less complexity, but at a small additional 
//! cost of additional router configuration.
use std::{
    sync::Arc, task::{Context, Poll}
};

use futures::future::BoxFuture;
use http::uri::PathAndQuery;
use http_body_util::BodyExt;

use crate::{
    app::AppState,
    discover::Key,
    error::{api::Error, internal::InternalError},
    middleware::mapper::endpoint::ApiEndpoint,
    types::{provider::Provider, request::{Request, RequestContext}},
};

#[derive(Debug, Clone)]
pub struct Service<S> {
    inner: S,
    app_state: AppState,
}

impl<S> Service<S> {
    pub fn new(inner: S, app_state: AppState) -> Self {
        Self { inner, app_state }
    }
}

impl<S> tower::Service<Request> for Service<S>
where
    S: tower::Service<Request, Error = Error> + Clone + Send + 'static,
    S::Future: Send + 'static,
    S::Response: Send + 'static,
{
    type Response = S::Response;
    type Error = Error;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    #[inline]
    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    #[tracing::instrument(name = "mapper", skip_all)]
    fn call(&mut self, mut req: Request) -> Self::Future {
        let app_state = self.app_state.clone();
        let mut inner = self.inner.clone();
        std::mem::swap(&mut self.inner, &mut inner);
        Box::pin(async move {
            let key = req.extensions_mut().remove::<Key>().ok_or(
                Error::Internal(InternalError::ExtensionNotFound("Key")),
            )?;
            let req_ctx = req
                .extensions()
                .get::<Arc<RequestContext>>()
                .ok_or(Error::Internal(InternalError::ExtensionNotFound(
                    "RequestContext",
                )))?
                .clone();
            let request_style = req_ctx.router_config.request_style;

            if key.provider != request_style {
                tracing::debug!(%request_style, target_provider = %key.provider, "mapping request body");
                let req = map_request(app_state, request_style, key, req).await?;
                inner.call(req).await
            } else {
                inner.call(req).await
            }
        })
    }
}

async fn map_request(
    app_state: AppState,
    request_style: Provider,
    key: Key,
    mut req: Request,
) -> Result<Request, Error> {
    tracing::debug!("about to extract path and query");
    let extracted_path_and_query =
        req.extensions_mut().remove::<PathAndQuery>().ok_or(
            Error::Internal(InternalError::ExtensionNotFound("PathAndQuery")),
        )?;
    tracing::debug!(extracted_path_and_query = ?extracted_path_and_query, "extracted path and query");
    let source_endpoint =
        ApiEndpoint::new(&extracted_path_and_query, request_style)?;
    let target_endpoint = ApiEndpoint::mapped(source_endpoint, key.provider)?;
    tracing::debug!(source_endpoint = ?source_endpoint, target_endpoint = ?target_endpoint, "endpoints");
    let (parts, body) = req.into_parts();
    tracing::debug!("collecting body");
    let body = body
        .collect()
        .await
        .map_err(InternalError::CollectBodyError)?
        .to_bytes();
    tracing::debug!("body collected");
    let (body, target_path_and_query) = source_endpoint.map(
        &app_state,
        &body,
        &extracted_path_and_query,
        target_endpoint,
    )?;
    let mut req = Request::from_parts(parts, axum_core::body::Body::from(body));
    tracing::debug!(target_path_and_query = ?target_path_and_query, "inserting target path and query");
    req.extensions_mut().insert(target_path_and_query);
    Ok(req)
}

#[derive(Debug, Clone)]
pub struct Layer {
    app_state: AppState,
}

impl Layer {
    pub fn new(app_state: AppState) -> Self {
        Self { app_state }
    }
}

impl<S> tower::Layer<S> for Layer {
    type Service = Service<S>;

    fn layer(&self, inner: S) -> Self::Service {
        Service::new(inner, self.app_state.clone())
    }
}
