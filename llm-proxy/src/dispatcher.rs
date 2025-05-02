use std::{
    str::FromStr,
    sync::Arc,
    task::{Context, Poll},
};

use futures::future::BoxFuture;
use http::{HeaderName, HeaderValue, uri::PathAndQuery};
use http_body_util::BodyExt;
use reqwest::Client;
use tower::{Service, ServiceBuilder};
use tower_http::add_extension::{AddExtension, AddExtensionLayer};

use crate::{
    app::AppState,
    config::providers::DEFAULT_ANTHROPIC_VERSION,
    discover::Key,
    error::{api::Error, init::InitError, internal::InternalError},
    logger::service::LoggerService,
    types::{
        provider::Provider,
        request::{Request, RequestContext},
        response::Response,
    },
    utils::handle_error::{ErrorHandler, ErrorHandlerLayer},
};

pub type DispatcherFuture = BoxFuture<'static, Result<Response, Error>>;
pub type DispatcherService = AddExtension<
    ErrorHandler<crate::middleware::mapper::Service<Dispatcher>>,
    Key,
>;

/// Leaf service that dispatches requests to the correct provider.
#[derive(Debug, Clone)]
pub struct Dispatcher {
    client: Client,
    app_state: AppState,
    key: Key,
}

impl Dispatcher {
    pub fn new(client: Client, app_state: AppState, key: Key) -> Self {
        Self {
            client,
            app_state,
            key,
        }
    }

    pub fn new_with_middleware(
        app_state: AppState,
        key: Key,
    ) -> Result<DispatcherService, InitError> {
        let http_client = Client::builder()
            .connect_timeout(app_state.0.config.dispatcher.connection_timeout)
            .timeout(app_state.0.config.dispatcher.timeout)
            .tcp_nodelay(true)
            .build()
            .map_err(InitError::CreateReqwestClient)?;
        Ok(ServiceBuilder::new()
            .layer(AddExtensionLayer::new(key))
            .layer(ErrorHandlerLayer)
            .layer(crate::middleware::mapper::Layer::new(app_state.clone()))
            // other middleware: rate limiting, logging, etc, etc
            // will be added here as well
            .service(Dispatcher::new(http_client, app_state, key)))
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

    #[tracing::instrument(name = "dispatcher", skip_all)]
    fn call(&mut self, req: Request) -> Self::Future {
        // see: https://docs.rs/tower/latest/tower/trait.Service.html#be-careful-when-cloning-inner-services
        let this = self.clone();
        let this = std::mem::replace(self, this);
        tracing::trace!(key = ?self.key, "Dispatcher received request");
        Box::pin(async move { this.dispatch(req).await })
    }
}

impl Dispatcher {
    async fn dispatch(&self, mut req: Request) -> Result<Response, Error> {
        let req_ctx = req
            .extensions()
            .get::<Arc<RequestContext>>()
            .ok_or(InternalError::ExtensionNotFound("RequestContext"))?
            .clone();
        let target_provider = self.key.provider;
        let provider_api_key = req_ctx
            .proxy_context
            .provider_api_keys
            .as_ref()
            .get(&target_provider)
            .ok_or_else(|| {
                InternalError::ProviderNotConfigured(target_provider)
            })?
            .clone();
        let provider_config = self
            .app_state
            .0
            .config
            .providers
            .get(&target_provider)
            .ok_or_else(|| {
                InternalError::ProviderNotConfigured(target_provider)
            })?;
        let base_url = provider_config.base_url.clone();
        {
            let r = req.headers_mut();
            r.remove(http::header::HOST);
            let host_header = match base_url.host() {
                Some(url::Host::Domain(host)) => {
                    HeaderValue::from_str(host).unwrap()
                }
                _ => HeaderValue::from_str("").unwrap(),
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
                    let version = provider_config
                        .version
                        .as_deref()
                        .unwrap_or(DEFAULT_ANTHROPIC_VERSION);
                    r.insert(
                        HeaderName::from_str("x-api-key").unwrap(),
                        HeaderValue::from_str(&provider_api_key)
                            .map_err(InternalError::InvalidHeader)?,
                    );
                    r.insert(
                        HeaderName::from_str("anthropic-version").unwrap(),
                        HeaderValue::from_str(version)
                            .map_err(InternalError::InvalidHeader)?,
                    );
                }
                _ => todo!(
                    "only anthropic and openai are supported at the moment"
                ),
            }
        }
        let method = req.method().clone();
        let headers = req.headers().clone();
        let extracted_path_and_query = req
            .extensions()
            .get::<PathAndQuery>()
            .ok_or(Error::Internal(
            InternalError::ExtensionNotFound("PathAndQuery"),
        ))?;

        let target_url = base_url
            .join(extracted_path_and_query.as_str())
            .expect("PathAndQuery joined with valid url will always succeed");
        tracing::debug!(method = %method, target_url = %target_url, "dispatching request");
        // TODO: could change request type of dispatcher to
        // http::Request<reqwest::Body> in the mapper layer above this
        // to avoid collecting the body twice
        let req_body_bytes = req
            .into_body()
            .collect()
            .await
            .map_err(|e| InternalError::RequestBodyError(Box::new(e)))?
            .to_bytes();

        let mut response = self
            .client
            .request(method, target_url.clone())
            .headers(headers.clone())
            .body(req_body_bytes.clone())
            .send()
            .await
            .map_err(InternalError::ReqwestError)?;
        let provider_request_id = response.headers_mut().remove("x-request-id");
        tracing::debug!(provider_req_id = ?provider_request_id, status = %response.status(), "received response");

        let resp_status = response.status();
        let mut response_builder =
            http::Response::builder().status(resp_status);
        *response_builder.headers_mut().unwrap() = response.headers().clone();
        let (user_resp_body, body_reader) =
            crate::types::body::Body::wrap_stream(response.bytes_stream());

        let response_logger = LoggerService::builder()
            .app_state(self.app_state.clone())
            .req_ctx(req_ctx)
            .target_url(target_url)
            .request_headers(headers)
            .request_body(req_body_bytes)
            .response_status(resp_status)
            .response_body(body_reader)
            .service(self.key)
            .build();

        tokio::spawn(async move {
            if let Err(e) = response_logger.log().await {
                tracing::error!(error = %e, "failed to log response");
            }
        });

        let response = response_builder
            .body(axum_core::body::Body::new(user_resp_body))
            .map_err(InternalError::HttpError)?;

        Ok(response)
    }
}
