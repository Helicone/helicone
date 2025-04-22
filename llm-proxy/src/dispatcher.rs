use std::{
    str::FromStr,
    sync::Arc,
    task::{Context, Poll},
};

use bytes::Bytes;
use futures::future::BoxFuture;
use http::{HeaderName, HeaderValue};
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
pub type DispatcherService =
    crate::middleware::no_op::Service<Dispatcher, reqwest::Body>;

pub trait AiProviderDispatcher:
    Service<Request, Response = Response, Error = Error>
    + Clone
    + Send
    + Sync
    + 'static
{
    fn provider(&self) -> Provider;
}

#[derive(Debug, Clone)]
pub struct Dispatcher {
    client: Client,
    provider: Provider,
}

impl AiProviderDispatcher for Dispatcher {
    fn provider(&self) -> Provider {
        self.provider
    }
}

impl Dispatcher {
    pub fn new(client: Client, provider: Provider) -> Self {
        Self { client, provider }
    }

    pub fn new_with_middleware(
        app_state: AppState,
        provider: Provider,
    ) -> DispatcherService {
        let service_stack = ServiceBuilder::new()
            // just to show how we will add dispatcher-specific middleware later
            // e.g. for model/provider specific rate limiting, we need to do
            // that at this level rather than globally.
            .layer(crate::middleware::no_op::Layer::<reqwest::Body>::new(
                app_state.clone(),
            ))
            // other middleware: rate limiting, logging, etc, etc
            // will be added here as well
            .service(Dispatcher::new(Client::new(), provider));

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
        let this = self.clone();
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
        let target_provider = req_ctx.proxy_context.target_provider.clone();
        let target_url = req_ctx.proxy_context.target_url.clone();
        let provider_api_key = req_ctx
            .proxy_context
            .provider_api_keys
            .as_ref()
            .get(&target_provider)
            .unwrap()
            .clone();
        {
            let r = req.headers_mut();
            r.remove(http::header::HOST);
            let host_header = match target_url.host() {
                Some(url::Host::Domain(host)) => {
                    HeaderValue::from_str(host).unwrap()
                }
                None | _ => HeaderValue::from_str("").unwrap(),
            };
            r.insert(http::header::HOST, host_header);
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
        let target_uri = http::Uri::from_str(target_url.as_str()).unwrap();
        *req.uri_mut() = target_uri;
        let method = req.method().clone();
        let headers = req.headers().clone();
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
            .request(method, target_url)
            .headers(headers)
            .body(req_body_bytes)
            .send()
            .await
            .map_err(|e| InternalError::ReqwestError(e))?;

        Ok(response.into())
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
