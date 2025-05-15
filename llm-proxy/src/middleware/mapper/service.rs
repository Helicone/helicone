use std::{
    str::FromStr,
    sync::Arc,
    task::{Context, Poll},
};

use futures::{TryStreamExt, future::BoxFuture};
use http::uri::PathAndQuery;
use http_body_util::BodyExt;

use crate::{
    endpoints::ApiEndpoint,
    error::{api::Error, internal::InternalError},
    middleware::mapper::{
        error::MapperError, registry::EndpointConverterRegistry,
    },
    types::{
        provider::InferenceProvider,
        request::{Request, RequestContext, StreamContext},
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
    S: tower::Service<
            Request,
            Response = http::Response<crate::types::body::Body>,
            Error = Error,
        > + Clone
        + Send
        + 'static,
    S::Future: Send + 'static,
{
    type Response = Response;
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
                .ok_or(Error::Internal(InternalError::ExtensionNotFound(
                    "PathAndQuery",
                )))?;
            let source_endpoint = ApiEndpoint::new(
                extracted_path_and_query.path(),
                request_style,
            )?;
            if provider == request_style {
                // even though we don't need to map the request body, we still
                // need to deserialize the body in order to extract the `stream`
                // param
                let req = map_request_no_op(
                    converter_registry,
                    &source_endpoint,
                    &source_endpoint,
                    extracted_path_and_query,
                    req,
                )
                .await?;
                inner.call(req).await.map(|response| {
                    // no need to deserialize the response body, just stream to
                    // user
                    let (parts, body) = response.into_parts();
                    let body = axum_core::body::Body::new(body.inner);
                    http::Response::from_parts(parts, body)
                })
            } else {
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
                            target_endpoint,
                            source_endpoint,
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

    // For now, assume is_stream is true so we can accurately extract the stream
    // param via the `StreamRequest` trait.
    let is_stream = true;
    let converter = converter_registry
        .get_converter(source_endpoint, target_endpoint, is_stream)
        .ok_or_else(|| {
            InternalError::InvalidConverter(*source_endpoint, *target_endpoint)
        })?;

    let (body, stream_ctx) = converter.convert_req_body(body)?;
    tracing::trace!("stream_ctx: {:?}", stream_ctx);
    let mut req = Request::from_parts(parts, axum_core::body::Body::from(body));
    tracing::trace!(
        source_endpoint = ?source_endpoint, target_endpoint = ?target_endpoint,
        target_path_and_query = ?target_path_and_query, "mapped request");
    req.extensions_mut().insert(target_path_and_query);
    req.extensions_mut().insert(stream_ctx);
    req.extensions_mut().insert(*target_endpoint);
    Ok(req)
}

async fn map_request_no_op(
    converter_registry: EndpointConverterRegistry,
    source_endpoint: &ApiEndpoint,
    target_endpoint: &ApiEndpoint,
    target_path_and_query: PathAndQuery,
    req: Request,
) -> Result<Request, Error> {
    let (parts, body) = req.into_parts();
    let body = body
        .collect()
        .await
        .map_err(InternalError::CollectBodyError)?
        .to_bytes();

    // For now, assume is_stream is true so we can accurately extract the stream
    // param via the `StreamRequest` trait.
    let is_stream = true;
    let converter = converter_registry
        .get_converter(source_endpoint, target_endpoint, is_stream)
        .ok_or_else(|| {
            InternalError::InvalidConverter(*source_endpoint, *target_endpoint)
        })?;

    let (body, stream_ctx) = converter.convert_req_body(body)?;
    let mut req = Request::from_parts(parts, axum_core::body::Body::from(body));
    req.extensions_mut().insert(target_path_and_query);
    req.extensions_mut().insert(stream_ctx);
    req.extensions_mut().insert(*target_endpoint);
    Ok(req)
}

async fn map_response(
    converter_registry: EndpointConverterRegistry,
    source_endpoint: ApiEndpoint,
    target_endpoint: ApiEndpoint,
    resp: http::Response<crate::types::body::Body>,
) -> Result<Response, Error> {
    let stream_ctx = resp
        .extensions()
        .get::<StreamContext>()
        .ok_or(InternalError::ExtensionNotFound("StreamContext"))?;
    let is_stream = stream_ctx.is_stream;
    let (parts, body) = resp.into_parts();

    let converter = converter_registry
        .get_converter(&target_endpoint, &source_endpoint, is_stream)
        .ok_or_else(|| {
            InternalError::InvalidConverter(target_endpoint, source_endpoint)
        })?;

    if is_stream {
        tracing::info!("MAPPING RESPONSE, is_stream: {:?}", is_stream);
        // because we are using our custom body type, and we know it was
        // constructed in the dispatcher from either an SSE stream or a
        // stream of bytes, we can safely assume each frame is a single
        // SSE event in this branch
        let mapped_stream = body
            .into_data_stream()
            .map_err(|e| Error::Internal(InternalError::ReqwestError(e)))
            .try_filter_map({
                tracing::trace!("filtering map");
                let captured_registry = converter_registry.clone();
                move |bytes| {
                    let registry_for_future = captured_registry.clone();
                    async move {
                        tracing::trace!(
                            "got some bytes, stream={:?}",
                            is_stream
                        );
                        let converter = registry_for_future
                            .get_converter(
                                &target_endpoint,
                                &source_endpoint,
                                is_stream,
                            )
                            .ok_or_else(|| {
                                InternalError::InvalidConverter(
                                    target_endpoint,
                                    source_endpoint,
                                )
                            })?;
                        let converted_data =
                            converter.convert_resp_body(bytes)?;
                        if converted_data.is_none() {
                            tracing::trace!("no converted data");
                        }
                        Ok(converted_data)
                    }
                }
            });
        let final_body = axum_core::body::Body::new(
            reqwest::Body::wrap_stream(mapped_stream),
        );
        let new_resp = Response::from_parts(parts, final_body);
        tracing::trace!(
            source_endpoint = ?target_endpoint,
            target_endpoint = ?source_endpoint,
            "mapped streaming response"
        );
        Ok(new_resp)
    } else {
        let body_bytes = body
            .collect()
            .await
            .map_err(InternalError::ReqwestError)?
            .to_bytes();

        let mapped_body_bytes = converter
            .convert_resp_body(body_bytes)?
            .ok_or(MapperError::EmptyResponseBody)
            .map_err(InternalError::MapperError)?;
        let final_body = axum_core::body::Body::from(mapped_body_bytes);
        let new_resp = Response::from_parts(parts, final_body);
        tracing::trace!(
            source_endpoint = ?target_endpoint,
            target_endpoint = ?source_endpoint,
            "mapped non-streaming response"
        );
        Ok(new_resp)
    }
}

#[derive(Debug, Clone)]
pub struct Layer;

impl<S> tower::Layer<S> for Layer {
    type Service = Service<S>;

    fn layer(&self, inner: S) -> Self::Service {
        Service::new(inner)
    }
}
