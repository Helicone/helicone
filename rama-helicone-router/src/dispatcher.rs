use std::{convert::Infallible, str::FromStr, sync::Arc};

use http_body_util::BodyExt;
use rama::{
    http::{
        client::EasyHttpWebClient, layer::{
            auth::AsyncRequireAuthorizationLayer, compress_adapter::CompressAdaptLayer, map_response_body::MapResponseBodyLayer, remove_header::{
                RemoveRequestHeaderLayer, RemoveResponseHeaderLayer,
            }, required_header::AddRequiredRequestHeadersLayer
        }, Body, HeaderName, HeaderValue, Request, Response
    }, layer::ConsumeErrLayer, Layer, Service
};

use crate::{
    app::{AppState, Context}, error::{api::Error, internal::InternalError}, middleware::auth::AuthService, types::{provider::Provider, request::RequestContext}
};

pub trait AiProviderDispatcher:
    Service<AppState, Request, Response = Response, Error = Error>
    + Clone
    + Send
    + Sync
    + 'static
{
    fn provider(&self) -> Provider;
}

#[derive(Debug, Clone)]
pub struct Dispatcher {
    client: EasyHttpWebClient,
    provider: Provider,
}

impl AiProviderDispatcher for Dispatcher {
    fn provider(&self) -> Provider {
        self.provider
    }
}

impl Dispatcher {
    pub fn new(_ctx: Context, provider: Provider) -> Self {
        let client = EasyHttpWebClient::default()
            // for tls later, get config to load cert files from paths in config
            // from Context
            .maybe_with_tls_connector_config(None);
        Self { client, provider }
    }

    pub fn new_with_middleware(
        ctx: Context,
        provider: Provider,
    ) -> impl rama::Service<AppState, Request, Response = Response, Error = Infallible>
    {
        let dispatcher = Dispatcher::new(ctx, provider);
        (
            MapResponseBodyLayer::new(Body::new),
            ConsumeErrLayer::default(),
            RemoveResponseHeaderLayer::hop_by_hop(),
            RemoveRequestHeaderLayer::hop_by_hop(),
            CompressAdaptLayer::default(),
            AddRequiredRequestHeadersLayer::new(),
            AsyncRequireAuthorizationLayer::new(AuthService),
            crate::middleware::request_context::Layer,
        )
            .into_layer(dispatcher)
    }
}

impl Service<AppState, Request> for Dispatcher {
    type Response = Response;
    type Error = Error;

    #[tracing::instrument(skip_all)]
    fn serve(
        &self,
        ctx: Context,
        req: Request,
    ) -> impl futures::Future<Output = Result<Self::Response, Self::Error>> + Send
    {
        tracing::info!("Dispatcher::serve");
        let this = self.clone();
        tracing::info!(uri = %req.uri(), headers = ?req.headers(), "Received request");
        async move { this.dispatch(ctx, req).await }
    }
}

impl Dispatcher {
    async fn dispatch(
        &self,
        ctx: Context,
        mut req: Request,
    ) -> Result<Response, Error> {
        let req_ctx = ctx
            .get::<Arc<RequestContext>>()
            .ok_or(InternalError::ExtensionNotFound("RequestContext"))?;
        let target_provider = req_ctx.proxy_context.target_provider.clone();
        let target_base_url = ctx
            .state()
            .0
            .config
            .dispatcher
            .get_provider_url(target_provider)?
            .clone();
        let provider_api_key = req_ctx
            .proxy_context
            .provider_api_keys
            .as_ref()
            .get(&target_provider)
            .unwrap()
            .clone();
        // Get the parts after the router ID
        let remaining_path = req
            .uri()
            .path()
            .split('/')
            .skip(3)
            .collect::<Vec<&str>>()
            .join("/");
        let target_url = target_base_url.join(remaining_path.as_str()).unwrap();
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
            }
        }

        let target_uri = http::Uri::from_str(target_url.as_str()).unwrap();
        *req.uri_mut() = target_uri;
        tracing::info!(uri = %req.uri(), "Request to target provider");
        let response = self
            .client
            .serve(ctx, req)
            .await
            .map_err(InternalError::RequestClientError)?;
        let resp_headers = response.headers().clone();
        tracing::info!(headers = ?resp_headers, "Response headers");
        let status = response.status();
        let body = response.collect().await.unwrap();
        let json = String::from_utf8(body.to_bytes().to_vec()).unwrap();
        tracing::info!(status = %status, json = ?json, "Response body");
        let mut response_builder = Response::builder()
            .status(status);

        for (key, value) in resp_headers {
            response_builder = response_builder.header(key.unwrap(), value);
        }

        // let response = response_builder
            // .body(body)
            // .unwrap();
        let new_body = rama::http::Body::from(json);
        let response = response_builder.body(new_body).unwrap();
        Ok(response)
    }
}
