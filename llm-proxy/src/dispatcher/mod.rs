pub mod anthropic_client;
pub mod openai_client;

use std::{
    str::FromStr,
    sync::Arc,
    task::{Context, Poll},
};

use futures::future::BoxFuture;
use http::{HeaderName, uri::PathAndQuery};
use http_body_util::BodyExt;
use opentelemetry::KeyValue;
use tower::{Service, ServiceBuilder};
use tower_http::add_extension::{AddExtension, AddExtensionLayer};
use tracing::Instrument;

use crate::{
    app::AppState,
    config::router::RouterConfig,
    dispatcher::{
        anthropic_client::Client as AnthropicClient,
        openai_client::Client as OpenAIClient,
    },
    error::{api::Error, init::InitError, internal::InternalError},
    logger::service::LoggerService,
    middleware::mapper::{
        model::ModelMapper, registry::EndpointConverterRegistry,
    },
    types::{
        provider::InferenceProvider,
        request::{Request, RequestContext},
        response::Response,
        secret::Secret,
    },
    utils::handle_error::{ErrorHandler, ErrorHandlerLayer},
};

pub type DispatcherFuture = BoxFuture<'static, Result<Response, Error>>;
pub type DispatcherService = AddExtension<
    AddExtension<
        ErrorHandler<crate::middleware::mapper::Service<Dispatcher>>,
        EndpointConverterRegistry,
    >,
    InferenceProvider,
>;

#[derive(Debug, Clone)]
pub enum Client {
    OpenAI(OpenAIClient),
    Anthropic(AnthropicClient),
}

impl AsRef<reqwest::Client> for Client {
    fn as_ref(&self) -> &reqwest::Client {
        match self {
            Client::OpenAI(client) => &client.0,
            Client::Anthropic(client) => &client.0,
        }
    }
}

/// Leaf service that dispatches requests to the correct provider.
#[derive(Debug, Clone)]
pub struct Dispatcher {
    client: Client,
    app_state: AppState,
    provider: InferenceProvider,
}

impl Dispatcher {
    pub fn new(
        app_state: AppState,
        router_config: &Arc<RouterConfig>,
        provider: InferenceProvider,
        provider_api_key: &Secret<String>,
    ) -> Result<DispatcherService, InitError> {
        // connection timeout, timeout, etc.
        let base_client = reqwest::Client::builder()
            .connect_timeout(app_state.0.config.dispatcher.connection_timeout)
            .timeout(app_state.0.config.dispatcher.timeout)
            .tcp_nodelay(true);
        let client = match provider {
            InferenceProvider::OpenAI => Client::OpenAI(OpenAIClient::new(
                &app_state,
                base_client,
                provider_api_key,
            )?),
            InferenceProvider::Anthropic => {
                Client::Anthropic(AnthropicClient::new(
                    &app_state,
                    base_client,
                    provider_api_key,
                )?)
            }
            _ => todo!("only openai and anthropic are supported at the moment"),
        };

        let dispatcher = Self {
            client,
            app_state: app_state.clone(),
            provider,
        };
        let model_mapper =
            ModelMapper::new(app_state.clone(), router_config.clone());
        let converter_registry =
            EndpointConverterRegistry::new(router_config, model_mapper);

        Ok(ServiceBuilder::new()
            .layer(AddExtensionLayer::new(provider))
            .layer(AddExtensionLayer::new(converter_registry))
            .layer(ErrorHandlerLayer::new(app_state))
            .layer(crate::middleware::mapper::Layer)
            // other middleware: rate limiting, logging, etc, etc
            // will be added here as well
            .service(dispatcher))
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
        tracing::trace!(provider = ?this.provider, "Dispatcher received request");
        Box::pin(async move { this.dispatch(req).await })
    }
}

impl Dispatcher {
    #[allow(clippy::too_many_lines)]
    async fn dispatch(&self, mut req: Request) -> Result<Response, Error> {
        let req_ctx = req
            .extensions()
            .get::<Arc<RequestContext>>()
            .ok_or(InternalError::ExtensionNotFound("RequestContext"))?
            .clone();
        let target_provider = self.provider;
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
            r.remove(http::header::AUTHORIZATION);
            r.remove(http::header::CONTENT_LENGTH);
            r.remove(HeaderName::from_str("helicone-api-key").unwrap());
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
            .as_ref()
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
            .provider(target_provider)
            .build();

        let app_state = self.app_state.clone();
        tokio::spawn(
            async move {
                if let Err(e) = response_logger.log().await {
                    tracing::error!(error = %e, "failed to log response");
                    let error_str = e.as_ref().to_string();
                    app_state
                        .0
                        .metrics
                        .error_count
                        .add(1, &[KeyValue::new("type", error_str)]);
                }
            }
            .instrument(tracing::Span::current()),
        );

        let response = response_builder
            .body(axum_core::body::Body::new(user_resp_body))
            .map_err(InternalError::HttpError)?;

        Ok(response)
    }
}
