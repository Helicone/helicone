use std::{
    str::FromStr,
    sync::Arc,
    task::{Context, Poll},
};

use bytes::Bytes;
use futures::future::BoxFuture;
use http::{HeaderName, HeaderValue, uri::PathAndQuery};
use http_body_util::BodyExt;
use reqwest::Client;
use tower::{Service, ServiceBuilder};

use crate::{
    app::AppState,
    error::{api::Error, internal::InternalError},
    mapper::TryConvert,
    types::{
        provider::Provider,
        request::{Request, RequestContext},
        response::Response,
    },
};

pub type DispatcherFuture = BoxFuture<'static, Result<Response, Error>>;
pub type DispatcherService = crate::middleware::no_op::Service<Dispatcher>;

#[derive(Debug, Clone)]
pub struct Dispatcher {
    client: Client,
    _app_state: AppState,
    provider: Provider,
}

impl Dispatcher {
    pub fn new(
        client: Client,
        app_state: AppState,
        provider: Provider,
    ) -> Self {
        Self {
            client,
            _app_state: app_state,
            provider,
        }
    }

    pub fn new_with_middleware(
        client: Client,
        app_state: AppState,
        provider: Provider,
    ) -> DispatcherService {
        let service_stack = ServiceBuilder::new()
            // just to show how we will add dispatcher-specific middleware later
            // e.g. for model/provider specific rate limiting, we need to do
            // that at this level rather than globally.
            .layer(crate::middleware::no_op::Layer::new(app_state.clone()))
            // other middleware: rate limiting, logging, etc, etc
            // will be added here as well
            .service(Dispatcher::new(client, app_state, provider));

        service_stack
    }
}

impl Service<Request> for Dispatcher {
    type Response = Response;
    type Error = Error;
    type Future = DispatcherFuture;

    fn poll_ready(
        &mut self,
        _cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    #[tracing::instrument(name = "Dispatcher::call", skip(self, req))]
    fn call(&mut self, req: Request) -> Self::Future {
        tracing::info!("Dispatcher::call");
        // see: https://docs.rs/tower/latest/tower/trait.Service.html#be-careful-when-cloning-inner-services
        let this = self.clone();
        let this = std::mem::replace(self, this);
        tracing::debug!(uri = %req.uri(), headers = ?req.headers(), "Received request");
        Box::pin(async move { this.dispatch(req).await })
    }
}

impl Dispatcher {
    async fn dispatch(&self, mut req: Request) -> Result<Response, Error> {
        let req_ctx = req
            .extensions()
            .get::<Arc<RequestContext>>()
            .ok_or(InternalError::ExtensionNotFound("RequestContext"))?;
        let og_provider = req_ctx.proxy_context.original_provider.clone();
        let target_provider = self.provider;
        // let target_url = app_state
        //     .0
        //     .config
        //     .discover
        //     .providers
        //     .get(&target_provider)
        //     .ok_or(InternalError::ProviderNotConfigured(target_provider))?
        //     .base_url
        //     .clone();
        // tracing::debug!(target_url = %target_url, "got target url");
        let provider_api_key = req_ctx
            .proxy_context
            .provider_api_keys
            .as_ref()
            .get(&target_provider)
            .unwrap()
            .clone();
        {
            let r = req.headers_mut();
            // r.remove(http::header::HOST);
            // let host_header = match target_url.host() {
            //     Some(url::Host::Domain(host)) => {
            //         HeaderValue::from_str(host).unwrap()
            //     }
            //     None | _ => HeaderValue::from_str("").unwrap(),
            // };
            // r.insert(http::header::HOST, host_header);
            r.remove(http::header::AUTHORIZATION);
            r.remove(http::header::CONTENT_LENGTH);
            r.remove(HeaderName::from_str("helicone-api-key").unwrap());
            match target_provider {
                Provider::OpenAI => {
                    let openai_auth_header =
                        format!("Bearer {}", provider_api_key.0);
                    r.insert(
                        http::header::AUTHORIZATION,
                        HeaderValue::from_str(&openai_auth_header).unwrap(),
                    );
                }
                Provider::Anthropic => {
                    r.insert(
                        HeaderName::from_str("x-api-key").unwrap(),
                        HeaderValue::from_str(&provider_api_key).unwrap(),
                    );
                    r.insert(
                        HeaderName::from_str("anthropic-version").unwrap(),
                        HeaderValue::from_str("2023-06-01").unwrap(),
                    );
                }
                _ => todo!(
                    "only anthropic and openai are supported at the moment"
                ),
            }
        }
        // let target_uri = http::Uri::from_str(target_url.as_str()).unwrap();
        // *req.uri_mut() = target_uri;
        let method = req.method().clone();
        let headers = req.headers().clone();
        let path_and_query = req
            .uri()
            .path_and_query()
            .cloned()
            .unwrap_or_else(|| PathAndQuery::from_static("/"));
        let req_body_bytes = req
            .into_body()
            .collect()
            .await
            .map_err(|e| InternalError::RequestBodyError(Box::new(e)))?
            .to_bytes();

        let req_body_bytes = match (og_provider, target_provider) {
            (Provider::OpenAI, Provider::OpenAI) => req_body_bytes,
            (Provider::Anthropic, Provider::Anthropic) => req_body_bytes,
            (Provider::OpenAI, Provider::Anthropic) => {
                convert_openai_to_anthropic(req_body_bytes)?
            }
            _ => {
                todo!("only anthropic and openai are supported at the moment")
            }
        };
        let response = self
            .client
            .request(method, path_and_query.as_str())
            .headers(headers)
            .body(req_body_bytes)
            .send()
            .await
            .map_err(|e| InternalError::ReqwestError(e))?;

        let mut response_builder =
            http::Response::builder().status(response.status());
        *response_builder.headers_mut().unwrap() = response.headers().clone();
        let response = response_builder
            .body(axum_core::body::Body::from_stream(response.bytes_stream()))
            .map_err(InternalError::HttpError)?;

        Ok(response)
    }
}

fn convert_openai_to_anthropic(req_body_bytes: Bytes) -> Result<Bytes, Error> {
    let openai_req = serde_json::from_slice::<
        openai_types::chat::ChatCompletionRequest,
    >(&req_body_bytes)
    .unwrap();
    let anthropic_req: anthropic_types::chat::ChatCompletionRequest =
        TryConvert::try_convert(openai_req)
            .map_err(|e| InternalError::MapperError(e))?;
    let anthropic_req_bytes = serde_json::to_vec(&anthropic_req).unwrap();
    Ok(Bytes::from(anthropic_req_bytes))
}
