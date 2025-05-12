use std::{
    str::FromStr,
    sync::Arc,
    task::{Context, Poll},
};

use futures::future::BoxFuture;
use http::uri::PathAndQuery;
use http_body_util::BodyExt;

use crate::{
    endpoints::ApiEndpoint,
    error::{api::Error, internal::InternalError},
    middleware::mapper::registry::EndpointConverterRegistry,
    types::{
        provider::InferenceProvider,
        request::{Request, RequestContext},
        response::Response,
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

impl<S> tower::Service<Request> for Service<S>
where
    S: tower::Service<Request, Response = Response, Error = Error>
        + Clone
        + Send
        + 'static,
    S::Future: Send + 'static,
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
        let mut inner = self.inner.clone();
        std::mem::swap(&mut self.inner, &mut inner);
        Box::pin(async move {
            let provider = *req
                .extensions_mut()
                .get::<InferenceProvider>()
                .ok_or(Error::Internal(InternalError::ExtensionNotFound(
                    "Provider",
                )))?;
            let req_ctx = req
                .extensions()
                .get::<Arc<RequestContext>>()
                .ok_or(Error::Internal(InternalError::ExtensionNotFound(
                    "RequestContext",
                )))?
                .clone();
            let request_style = req_ctx.router_config.request_style;
            tracing::trace!(
                request_style = %request_style,
                provider = %provider,
                "Mapper"
            );
            if provider == request_style {
                inner.call(req).await
            } else {
                let converter_registry = req
                    .extensions()
                    .get::<EndpointConverterRegistry>()
                    .ok_or(Error::Internal(InternalError::ExtensionNotFound(
                        "EndpointConverterRegistry",
                    )))?
                    .clone();
                let extracted_path_and_query = req
                    .extensions_mut()
                    .remove::<PathAndQuery>()
                    .ok_or(Error::Internal(
                        InternalError::ExtensionNotFound("PathAndQuery"),
                    ))?;
                let source_endpoint =
                    ApiEndpoint::new(&extracted_path_and_query, request_style)?;
                let target_endpoint =
                    ApiEndpoint::mapped(source_endpoint, provider)?;
                // serialization/deserialization should be done on a dedicated
                // thread
                let converter_registry_cloned = converter_registry.clone();
                let req = tokio::task::spawn_blocking(move || async move {
                    map_request(
                        converter_registry_cloned,
                        &source_endpoint,
                        &target_endpoint,
                        &extracted_path_and_query,
                        req,
                    )
                    .await
                })
                .await
                .map_err(InternalError::MappingTaskError)?
                .await?;
                let response = inner.call(req).await?;
                let response =
                    tokio::task::spawn_blocking(move || async move {
                        map_response(
                            converter_registry,
                            &target_endpoint,
                            &source_endpoint,
                            response,
                        )
                        .await
                    })
                    .await
                    .map_err(InternalError::MappingTaskError)?
                    .await?;
                Ok(response)
            }
        })
    }
}

async fn map_request(
    converter_registry: EndpointConverterRegistry,
    source_endpoint: &ApiEndpoint,
    target_endpoint: &ApiEndpoint,
    target_path_and_query: &PathAndQuery,
    req: Request,
) -> Result<Request, Error> {
    let (parts, body) = req.into_parts();
    let body = body
        .collect()
        .await
        .map_err(InternalError::CollectBodyError)?
        .to_bytes();
    let target_path_and_query =
        if let Some(query_params) = target_path_and_query.query() {
            format!("{}?{}", target_endpoint.path(), query_params)
        } else {
            target_endpoint.path().to_string()
        };
    let target_path_and_query = PathAndQuery::from_str(&target_path_and_query)
        .map_err(InternalError::InvalidUri)?;

    let converter = converter_registry
        .get_converter(source_endpoint, target_endpoint)
        .ok_or_else(|| {
            InternalError::InvalidConverter(*source_endpoint, *target_endpoint)
        })?;

    let body = converter.convert_req_body(&body)?;
    let mut req = Request::from_parts(parts, axum_core::body::Body::from(body));
    tracing::trace!(
        source_endpoint = ?source_endpoint, target_endpoint = ?target_endpoint,
        target_path_and_query = ?target_path_and_query, "mapped request");
    req.extensions_mut().insert(target_path_and_query);
    Ok(req)
}

async fn map_response(
    converter_registry: EndpointConverterRegistry,
    source_endpoint: &ApiEndpoint,
    target_endpoint: &ApiEndpoint,
    resp: Response,
) -> Result<Response, Error> {
    let (parts, body) = resp.into_parts();
    // NOTE: collecting the body here also will send it to the async task for
    // logging
    let body = body
        .collect()
        .await
        .map_err(InternalError::CollectBodyError)?
        .to_bytes();

    let converter = converter_registry
        .get_converter(target_endpoint, source_endpoint)
        .ok_or_else(|| {
            InternalError::InvalidConverter(*target_endpoint, *source_endpoint)
        })?;

    let body = converter.convert_resp_body(&body)?;
    let req = Response::from_parts(parts, axum_core::body::Body::from(body));
    tracing::trace!("mapped response");
    Ok(req)
}

#[derive(Debug, Clone)]
pub struct Layer;

impl<S> tower::Layer<S> for Layer {
    type Service = Service<S>;

    fn layer(&self, inner: S) -> Self::Service {
        Service::new(inner)
    }
}
