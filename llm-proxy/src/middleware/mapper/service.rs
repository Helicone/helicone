use std::{
    sync::Arc,
    task::{Context, Poll},
};

use bytes::Bytes;
use futures::future::BoxFuture;
use http::uri::PathAndQuery;
use http_body_util::BodyExt;

use crate::{
    discover::Key,
    error::{
        api::Error, internal::InternalError, invalid_req::InvalidRequestError,
    },
    middleware::mapper::{
        TryConvert,
        endpoint::{Anthropic, ApiEndpoint, OpenAI},
    },
    types::request::{Request, RequestContext},
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
            let default_provider = req_ctx.router_config.providers.first();

            if key.provider != *default_provider {
                tracing::debug!(%default_provider, target_provider = %key.provider, "mapping request");
                let req = map_request(key, req_ctx, req).await?;
                inner.call(req).await.map_err(Into::into)
            } else {
                inner.call(req).await.map_err(Into::into)
            }
        })
    }
}

async fn map_request(
    key: Key,
    req_ctx: Arc<RequestContext>,
    mut req: Request,
) -> Result<Request, Error> {
    let extracted_path_and_query =
        req.extensions_mut().remove::<PathAndQuery>().ok_or(
            Error::Internal(InternalError::ExtensionNotFound("PathAndQuery")),
        )?;
    let default_provider = req_ctx.router_config.providers.first();
    // TODO: remove clones
    let source_endpoint =
        ApiEndpoint::new(extracted_path_and_query.clone(), *default_provider)?;
    let target_endpoint = ApiEndpoint::mapped(source_endpoint, key.provider)?;
    let (parts, body) = req.into_parts();
    let body = body
        .collect()
        .await
        .map_err(InternalError::CollectBodyError)?
        .to_bytes();

    let (body, target_path_and_query) = match (source_endpoint, target_endpoint)
    {
        (ApiEndpoint::OpenAI(source), ApiEndpoint::Anthropic(target)) => {
            tracing::trace!(source = ?source, target = ?target, "mapping request body");
            match (source, target) {
                (OpenAI::ChatCompletions, Anthropic::Messages) => {
                    let target_path_and_query =
                        if let Some(query) = extracted_path_and_query.query() {
                            PathAndQuery::try_from(format!(
                                "{}?{}",
                                target.path(),
                                query
                            ))
                            .map_err(InternalError::InvalidUri)?
                        } else {
                            PathAndQuery::try_from(target.path())
                                .map_err(InternalError::InvalidUri)?
                        };
                    let body = serde_json::from_slice::<
                        openai_types::chat::ChatCompletionRequest,
                    >(&body)
                    .map_err(InvalidRequestError::InvalidRequestBody)?;
                    let anthropic_req: anthropic_types::chat::ChatCompletionRequest =
                    TryConvert::try_convert(body)
                        .map_err(InternalError::MapperError)?;
                    let anthropic_req_bytes =
                        serde_json::to_vec(&anthropic_req).map_err(|e| {
                            InternalError::Serialize {
                            ty: "anthropic_types::chat::ChatCompletionRequest",
                            error: e,
                        }
                        })?;
                    let body = Bytes::from(anthropic_req_bytes);
                    (body, target_path_and_query)
                }
                _ => {
                    todo!()
                }
            }
        }
        _ => {
            todo!()
        }
    };
    let mut req = Request::from_parts(parts, axum_core::body::Body::from(body));
    tracing::debug!(target_path_and_query = ?target_path_and_query, "inserting target path and query");
    req.extensions_mut().insert(target_path_and_query);
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
