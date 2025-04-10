use std::{
    str::FromStr,
    sync::Arc,
    task::{Context, Poll},
};

use bytes::Bytes;
use futures::future::BoxFuture;
use http::{HeaderName, HeaderValue, Request, Response};
use http_body_util::{BodyExt, Full};
use reqwest::Client;
use tower::{Service, util::BoxService};

use crate::{
    error::{api::Error, internal::InternalError},
    mapper::TryConvert,
    types::request::{Provider, RequestContext},
};

pub type ReqBody = hyper::body::Incoming;
pub type RespBody = Full<Bytes>;
pub type DispatcherFuture =
    BoxFuture<'static, Result<Response<RespBody>, Error>>;
pub type DispatcherService =
    BoxService<Request<ReqBody>, Response<RespBody>, Error>;

pub trait AiProviderDispatcher:
    Service<Request<ReqBody>, Response = Response<RespBody>, Error = Error>
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
}

impl Service<Request<ReqBody>> for Dispatcher {
    type Response = Response<RespBody>;
    type Error = Error;
    type Future = DispatcherFuture;

    fn poll_ready(
        &mut self,
        _cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    fn call(&mut self, req: Request<ReqBody>) -> Self::Future {
        let this = self.clone();
        Box::pin(async move { this.dispatch(req).await })
    }
}

impl Dispatcher {
    async fn dispatch(
        &self,
        mut req: Request<ReqBody>,
    ) -> Result<Response<RespBody>, Error> {
        let req_ctx = req
            .extensions()
            .get::<Arc<RequestContext>>()
            .ok_or(InternalError::RequestContextNotFound)?;
        let og_provider = req_ctx.proxy_context.original_provider.clone();
        let target_provider = req_ctx.proxy_context.target_provider.clone();
        let target_url = req_ctx.proxy_context.target_url.clone();
        let provider_api_key = req_ctx.proxy_context.provider_api_key.clone();
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
                        format!("Bearer {}", provider_api_key);
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
            (Provider::Anthropic, Provider::OpenAI) => {
                todo!()
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

        convert_reqwest_to_http_response(response).await
    }
}

async fn convert_reqwest_to_http_response(
    response: reqwest::Response,
) -> Result<Response<RespBody>, Error> {
    let mut resp_builder = Response::builder()
        .status(response.status())
        .version(response.version());
    for (key, value) in response.headers() {
        resp_builder = resp_builder.header(key, value);
    }
    let body = response
        .bytes()
        .await
        .map_err(|e| InternalError::ReqwestError(e))?;
    let body = Full::new(body);
    let http_resp = resp_builder
        .body(body)
        .map_err(|e| InternalError::HttpError(e))?;
    Ok(http_resp)
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
