use std::{
    sync::Arc,
    task::{Context, Poll},
};

use futures::future::BoxFuture;
use http::uri::PathAndQuery;
use http_body_util::BodyExt;

use crate::{
    app::AppState,
    discover::Key,
    error::{api::Error, internal::InternalError},
    middleware::mapper::endpoint::ApiEndpoint,
    types::{
        provider::Provider,
        request::{Request, RequestContext},
    },
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
                // serialization/deserialization should be done on a dedicated
                // thread
                let req = tokio::task::spawn_blocking(move || async move {
                    map_request(app_state, request_style, key, req).await
                })
                .await
                .map_err(InternalError::MappingTaskError)?
                .await?;
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
    let extracted_path_and_query =
        req.extensions_mut().remove::<PathAndQuery>().ok_or(
            Error::Internal(InternalError::ExtensionNotFound("PathAndQuery")),
        )?;
    let source_endpoint =
        ApiEndpoint::new(&extracted_path_and_query, request_style)?;
    let target_endpoint = ApiEndpoint::mapped(source_endpoint, key.provider)?;
    let (parts, body) = req.into_parts();
    let body = body
        .collect()
        .await
        .map_err(InternalError::CollectBodyError)?
        .to_bytes();
    let (body, target_path_and_query) = source_endpoint.map(
        &app_state,
        &body,
        &extracted_path_and_query,
        target_endpoint,
    )?;
    let mut req = Request::from_parts(parts, axum_core::body::Body::from(body));
    tracing::trace!(
        source_endpoint = ?source_endpoint, target_endpoint = ?target_endpoint,
        target_path_and_query = ?target_path_and_query, request_style = %request_style, "mapped request");
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
