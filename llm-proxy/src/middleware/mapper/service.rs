use std::{
    str::FromStr,
    task::{Context, Poll},
};

use futures::{TryStreamExt, future::BoxFuture};
use http::uri::PathAndQuery;
use tracing::{Instrument, info_span};

use crate::{
    endpoints::ApiEndpoint,
    error::{api::ApiError, internal::InternalError, mapper::MapperError},
    middleware::mapper::registry::EndpointConverterRegistry,
    types::{
        extensions::MapperContext, provider::InferenceProvider,
        request::Request, response::Response,
    },
};

#[derive(Debug, Clone)]
pub struct Service<S> {
    inner: S,
    endpoint_converter_registry: EndpointConverterRegistry,
}

impl<S> Service<S> {
    pub fn new(
        inner: S,
        endpoint_converter_registry: EndpointConverterRegistry,
    ) -> Self {
        Self {
            inner,
            endpoint_converter_registry,
        }
    }
}

impl<S> tower::Service<Request> for Service<S>
where
    S: tower::Service<
            Request,
            Response = http::Response<crate::types::body::Body>,
            Error = ApiError,
        > + Clone
        + Send
        + 'static,
    S::Future: Send + 'static,
{
    type Response = Response;
    type Error = ApiError;
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
        let converter_registry = self.endpoint_converter_registry.clone();
        std::mem::swap(&mut self.inner, &mut inner);
        Box::pin(async move {
            let target_provider = *req
                .extensions_mut()
                .get::<InferenceProvider>()
                .ok_or(ApiError::Internal(InternalError::ExtensionNotFound(
                    "Provider",
                )))?;
            let extracted_path_and_query = req
                .extensions_mut()
                .remove::<PathAndQuery>()
                .ok_or(ApiError::Internal(InternalError::ExtensionNotFound(
                    "PathAndQuery",
                )))?;
            let source_endpoint =
                req.extensions().get::<ApiEndpoint>().copied();
            if target_provider == InferenceProvider::OpenAI {
                let req = if let Some(source_endpoint) = source_endpoint {
                    // Since we support the OpenAI API only, then we can
                    // special case when our target provider is OpenAI.
                    // Even though we don't need to map the request body, we
                    // still need to deserialize the body in
                    // order to extract the `stream` param
                    map_request_no_op(
                        converter_registry,
                        &source_endpoint,
                        &source_endpoint,
                        extracted_path_and_query,
                        req,
                    )
                    .await?
                } else {
                    // For endpoints without first class support (where we don't
                    // have concrete types) then we must assume the request is
                    // not streaming.
                    let mapper_ctx = MapperContext {
                        is_stream: false,
                        model: None,
                    };
                    req.extensions_mut().insert(mapper_ctx);
                    req.extensions_mut().insert(extracted_path_and_query);
                    req
                };
                inner.call(req).await
            } else {
                let source_endpoint =
                    source_endpoint.ok_or(ApiError::Internal(
                        InternalError::ExtensionNotFound("ApiEndpoint"),
                    ))?;
                let target_endpoint =
                    ApiEndpoint::mapped(source_endpoint, target_provider)?;
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
                    .instrument(info_span!("map_request"))
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
                    .instrument(info_span!("map_response"))
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
) -> Result<Request, ApiError> {
    use http_body_util::BodyExt;
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

    let (body, mapper_ctx) = converter.convert_req_body(body)?;
    let mut req = Request::from_parts(parts, axum_core::body::Body::from(body));
    tracing::trace!(
        source_endpoint = ?source_endpoint,
        target_endpoint = ?target_endpoint,
        target_path_and_query = ?target_path_and_query,
        mapper_ctx = ?mapper_ctx,
        "mapped request"
    );
    req.extensions_mut().insert(target_path_and_query);
    req.extensions_mut().insert(mapper_ctx);
    req.extensions_mut().insert(*target_endpoint);
    Ok(req)
}

async fn map_request_no_op(
    converter_registry: EndpointConverterRegistry,
    source_endpoint: &ApiEndpoint,
    target_endpoint: &ApiEndpoint,
    target_path_and_query: PathAndQuery,
    req: Request,
) -> Result<Request, ApiError> {
    use http_body_util::BodyExt;
    let (parts, body) = req.into_parts();
    let body = body
        .collect()
        .await
        .map_err(InternalError::CollectBodyError)?
        .to_bytes();
    // we still collect the body and call the converter in order to map the
    // model name. eg if they send `model:
    // anthropic/claude-3-5-sonnet-20240620` from the OpenAI sdk,
    // and the only configured provider is OpenAI, we need to map the model name
    // but not change the structure of the request body.
    let converter = converter_registry
        .get_converter(source_endpoint, target_endpoint)
        .ok_or_else(|| {
            InternalError::InvalidConverter(*source_endpoint, *target_endpoint)
        })?;

    let (body, mapper_ctx) = converter.convert_req_body(body)?;
    let mut req = Request::from_parts(parts, axum_core::body::Body::from(body));
    tracing::trace!(
        endpoint = ?source_endpoint,
        target_path_and_query = ?target_path_and_query,
        mapper_ctx = ?mapper_ctx,
        "no-op request mapping"
    );
    req.extensions_mut().insert(target_path_and_query);
    req.extensions_mut().insert(mapper_ctx);
    req.extensions_mut().insert(*target_endpoint);
    Ok(req)
}

async fn map_response(
    converter_registry: EndpointConverterRegistry,
    source_endpoint: ApiEndpoint,
    target_endpoint: ApiEndpoint,
    resp: http::Response<crate::types::body::Body>,
) -> Result<Response, ApiError> {
    let mapper_ctx = resp
        .extensions()
        .get::<MapperContext>()
        .ok_or(InternalError::ExtensionNotFound("MapperContext"))?;
    let is_stream = mapper_ctx.is_stream;
    let (parts, body) = resp.into_parts();

    let converter = converter_registry
        .get_converter(&target_endpoint, &source_endpoint)
        .ok_or_else(|| {
            InternalError::InvalidConverter(target_endpoint, source_endpoint)
        })?;

    if is_stream {
        // because we are using our custom body type, and we know it was
        // constructed in the dispatcher from either an SSE stream or a
        // stream of bytes, we can safely assume each frame is a single
        // SSE event in this branch
        let mapped_stream = body
            .into_data_stream()
            .map_err(|e| ApiError::Internal(InternalError::CollectBodyError(e)))
            .try_filter_map({
                let captured_registry = converter_registry.clone();
                move |bytes| {
                    let registry_for_future = captured_registry.clone();
                    async move {
                        let converter = registry_for_future
                            .get_converter(&target_endpoint, &source_endpoint)
                            .ok_or_else(|| {
                                InternalError::InvalidConverter(
                                    target_endpoint,
                                    source_endpoint,
                                )
                            })?;
                        let converted_data =
                            converter.convert_resp_body(bytes, is_stream)?;
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
        use http_body_util::BodyExt;
        let body_bytes = body
            .collect()
            .await
            .map_err(InternalError::CollectBodyError)?
            .to_bytes();

        let mapped_body_bytes = converter
            .convert_resp_body(body_bytes, is_stream)?
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
pub struct Layer {
    endpoint_converter_registry: EndpointConverterRegistry,
}

impl Layer {
    #[must_use]
    pub fn new(endpoint_converter_registry: EndpointConverterRegistry) -> Self {
        Self {
            endpoint_converter_registry,
        }
    }
}

impl<S> tower::Layer<S> for Layer {
    type Service = Service<S>;

    fn layer(&self, inner: S) -> Self::Service {
        Service::new(inner, self.endpoint_converter_registry.clone())
    }
}
