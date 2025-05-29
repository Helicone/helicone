use std::{
    str::FromStr,
    sync::Arc,
    task::{Context, Poll},
};

use bytes::Bytes;
use futures::{TryStreamExt, future::BoxFuture};
use http::{HeaderMap, HeaderName, HeaderValue, StatusCode, uri::PathAndQuery};
use http_body_util::BodyExt;
use opentelemetry::KeyValue;
use reqwest::RequestBuilder;
use reqwest_eventsource::RequestBuilderExt;
use tower::{Service, ServiceBuilder};
use tracing::{Instrument, info_span};

use super::{SSEStream, sse_stream};
use crate::{
    app::AppState,
    config::router::RouterConfig,
    discover::monitor::health::EndpointMetricsRegistry,
    dispatcher::{
        anthropic_client::Client as AnthropicClient,
        extensions::ExtensionsCopier,
        google_gemini_client::Client as GoogleGeminiClient,
        openai_client::Client as OpenAIClient,
    },
    endpoints::ApiEndpoint,
    error::{api::ApiError, init::InitError, internal::InternalError},
    logger::service::LoggerService,
    middleware::{
        add_extension::{AddExtensions, AddExtensionsLayer},
        mapper::{model::ModelMapper, registry::EndpointConverterRegistry},
    },
    types::{
        provider::InferenceProvider,
        request::{AuthContext, MapperContext, Request, RequestContext},
        router::RouterId,
        secret::Secret,
    },
    utils::{
        ResponseExt as _,
        handle_error::{ErrorHandler, ErrorHandlerLayer},
    },
};

pub type DispatcherFuture = BoxFuture<
    'static,
    Result<http::Response<crate::types::body::Body>, ApiError>,
>;
pub type DispatcherService =
    AddExtensions<ErrorHandler<crate::middleware::mapper::Service<Dispatcher>>>;

#[derive(Debug, Clone)]
pub enum Client {
    OpenAI(OpenAIClient),
    Anthropic(AnthropicClient),
    GoogleGemini(GoogleGeminiClient),
}

impl Client {
    pub(crate) fn sse_stream<B>(
        request_builder: RequestBuilder,
        body: B,
    ) -> Result<SSEStream, InternalError>
    where
        B: Into<reqwest::Body>,
    {
        let event_source = request_builder
            .body(body)
            .eventsource()
            .map_err(|e| InternalError::RequestBodyError(Box::new(e)))?;
        Ok(sse_stream(event_source))
    }
}

impl AsRef<reqwest::Client> for Client {
    fn as_ref(&self) -> &reqwest::Client {
        match self {
            Client::OpenAI(client) => &client.0,
            Client::Anthropic(client) => &client.0,
            Client::GoogleGemini(client) => &client.0,
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
        router_id: RouterId,
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
            InferenceProvider::GoogleGemini => {
                Client::GoogleGemini(GoogleGeminiClient::new(
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
            EndpointConverterRegistry::new(router_config, &model_mapper);

        let extensions_layer = AddExtensionsLayer::builder()
            .inference_provider(provider)
            .endpoint_converter_registry(converter_registry)
            .router_id(router_id)
            .build();

        Ok(ServiceBuilder::new()
            .layer(extensions_layer)
            .layer(ErrorHandlerLayer::new(app_state))
            .layer(crate::middleware::mapper::Layer)
            // other middleware: rate limiting, logging, etc, etc
            // will be added here as well
            .service(dispatcher))
    }
}

impl Service<Request> for Dispatcher {
    type Response = http::Response<crate::types::body::Body>;
    type Error = ApiError;
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
    async fn dispatch(
        &self,
        mut req: Request,
    ) -> Result<http::Response<crate::types::body::Body>, ApiError> {
        let mapper_ctx = req
            .extensions_mut()
            .remove::<MapperContext>()
            .ok_or(InternalError::ExtensionNotFound("MapperContext"))?;
        let req_ctx = req
            .extensions_mut()
            .remove::<Arc<RequestContext>>()
            .ok_or(InternalError::ExtensionNotFound("RequestContext"))?;
        let auth_ctx = req_ctx.auth_context.as_ref();
        let api_endpoint = req.extensions().get::<ApiEndpoint>().copied();
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
            let h = req.headers_mut();
            h.remove(http::header::HOST);
            h.remove(http::header::AUTHORIZATION);
            h.remove(http::header::CONTENT_LENGTH);
            h.remove(HeaderName::from_str("helicone-api-key").unwrap());
        }
        let method = req.method().clone();
        let headers = req.headers().clone();
        let extracted_path_and_query = req
            .extensions_mut()
            .remove::<PathAndQuery>()
            .ok_or(ApiError::Internal(InternalError::ExtensionNotFound(
                "PathAndQuery",
            )))?;
        let inference_provider = req
            .extensions()
            .get::<InferenceProvider>()
            .copied()
            .ok_or(InternalError::ExtensionNotFound("InferenceProvider"))?;
        let router_id = req
            .extensions()
            .get::<RouterId>()
            .copied()
            .ok_or(InternalError::ExtensionNotFound("RouterId"))?;
        let extensions_copier = ExtensionsCopier::builder()
            .inference_provider(inference_provider)
            .router_id(router_id)
            .auth_context(auth_ctx.cloned())
            .build();

        let target_url = base_url
            .join(extracted_path_and_query.as_str())
            .expect("PathAndQuery joined with valid url will always succeed");
        tracing::debug!(method = %method, target_url = %target_url, "dispatching request");
        // TODO: could change request type of dispatcher to
        // http::Request<reqwest::Body>
        // to avoid collecting the body twice
        let req_body_bytes = req
            .into_body()
            .collect()
            .await
            .map_err(|e| InternalError::RequestBodyError(Box::new(e)))?
            .to_bytes();

        let request_builder = self
            .client
            .as_ref()
            .request(method, target_url.clone())
            .headers(headers.clone());

        let metrics_for_stream = self.app_state.0.endpoint_metrics.clone();
        if let Some(api_endpoint) = api_endpoint {
            let endpoint_metrics = self
                .app_state
                .0
                .endpoint_metrics
                .endpoint_metrics(api_endpoint)?;
            endpoint_metrics.incr_req_count();
        }

        let (mut response, body_reader): (
            http::Response<crate::types::body::Body>,
            Option<crate::types::body::BodyReader>,
        ) = if mapper_ctx.is_stream {
            Self::dispatch_stream(
                auth_ctx,
                request_builder,
                req_body_bytes.clone(),
                api_endpoint,
                metrics_for_stream,
            )?
        } else {
            self.dispatch_sync(
                auth_ctx,
                request_builder,
                req_body_bytes.clone(),
            )
            .instrument(info_span!("dispatch_sync"))
            .await?
        };
        let provider_request_id = {
            let headers = response.headers_mut();
            headers.remove(http::header::CONTENT_LENGTH);
            headers.remove("x-request-id")
        };
        tracing::debug!(provider_req_id = ?provider_request_id, status = %response.status(), "received response");
        extensions_copier.copy_extensions(response.extensions_mut());
        response.extensions_mut().insert(mapper_ctx);
        response.extensions_mut().insert(api_endpoint);
        response.extensions_mut().insert(extracted_path_and_query);

        if let Some(body_reader) = body_reader {
            let response_logger = LoggerService::builder()
                .app_state(self.app_state.clone())
                .req_ctx(req_ctx)
                .target_url(target_url)
                .request_headers(headers)
                .request_body(req_body_bytes)
                .response_status(response.status())
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
        }

        if response.status().is_server_error() {
            if let Some(api_endpoint) = api_endpoint {
                let endpoint_metrics = self
                    .app_state
                    .0
                    .endpoint_metrics
                    .endpoint_metrics(api_endpoint)?;
                endpoint_metrics.incr_remote_internal_error_count();
            }
        }

        response.error_for_status()
    }

    fn dispatch_stream(
        auth_context: Option<&AuthContext>,
        request_builder: RequestBuilder,
        req_body_bytes: Bytes,
        api_endpoint: Option<ApiEndpoint>,
        metrics_registry: EndpointMetricsRegistry,
    ) -> Result<
        (
            http::Response<crate::types::body::Body>,
            Option<crate::types::body::BodyReader>,
        ),
        ApiError,
    > {
        let response_stream = Client::sse_stream(
            request_builder,
            req_body_bytes,
        )?
        .map_err(move |e| {
            if let InternalError::StreamError(error) = &e {
                cfg_if::cfg_if! {
                    if #[cfg(debug_assertions)] {
                        if let Some(api_endpoint) = api_endpoint {
                            metrics_registry.endpoint_metrics(api_endpoint).map(|metrics| {
                                metrics.incr_for_stream_error_debug(error);
                            }).inspect_err(|e| {
                                tracing::error!(error = %e, "failed to increment stream error metrics");
                            }).ok();
                        }
                    } else {
                        if let Some(api_endpoint) = api_endpoint {
                            metrics_registry.endpoint_metrics(api_endpoint).map(|metrics| {
                                metrics.incr_for_stream_error(error);
                            }).inspect_err(|e| {
                                tracing::error!(error = %e, "failed to increment stream error metrics");
                            }).ok();
                        }
                    }
                }
            }
            e
        });
        let mut resp_builder = http::Response::builder();
        *resp_builder.headers_mut().unwrap() = stream_response_headers();
        resp_builder = resp_builder.status(StatusCode::OK);
        if auth_context.is_some() {
            let (user_resp_body, body_reader) =
                crate::types::body::Body::wrap_stream(response_stream, true);
            let response = resp_builder
                .body(user_resp_body)
                .map_err(InternalError::HttpError)?;
            Ok((response, Some(body_reader)))
        } else {
            let body = crate::types::body::Body::new(
                reqwest::Body::wrap_stream(response_stream),
            );
            let response =
                resp_builder.body(body).map_err(InternalError::HttpError)?;
            Ok((response, None))
        }
    }

    async fn dispatch_sync(
        &self,
        auth_context: Option<&AuthContext>,
        request_builder: RequestBuilder,
        req_body_bytes: Bytes,
    ) -> Result<
        (
            http::Response<crate::types::body::Body>,
            Option<crate::types::body::BodyReader>,
        ),
        ApiError,
    > {
        let response = request_builder
            .body(req_body_bytes)
            .send()
            .await
            .map_err(InternalError::ReqwestError)?;

        let status = response.status();
        let mut resp_builder = http::Response::builder().status(status);
        *resp_builder.headers_mut().unwrap() = response.headers().clone();

        // this is compiled out in release builds
        #[cfg(debug_assertions)]
        if status.is_server_error() || status.is_client_error() {
            let body =
                response.text().await.map_err(InternalError::ReqwestError)?;
            tracing::error!(error_resp = %body, "received error response");
            let bytes = bytes::Bytes::from(body);
            let stream = futures::stream::once(futures::future::ok::<
                _,
                InternalError,
            >(bytes));
            let (error_body, error_reader) =
                crate::types::body::Body::wrap_stream(stream, false);
            let response = resp_builder
                .body(error_body)
                .map_err(InternalError::HttpError)?;
            return Ok((response, Some(error_reader)));
        }

        if auth_context.is_some() {
            let (user_resp_body, body_reader) =
                crate::types::body::Body::wrap_stream(
                    response
                        .bytes_stream()
                        .map_err(InternalError::ReqwestError),
                    false,
                );
            let response = resp_builder
                .body(user_resp_body)
                .map_err(InternalError::HttpError)?;
            Ok((response, Some(body_reader)))
        } else {
            let body = crate::types::body::Body::new(
                reqwest::Body::wrap_stream(response.bytes_stream()),
            );
            let response =
                resp_builder.body(body).map_err(InternalError::HttpError)?;
            Ok((response, None))
        }
    }
}

fn stream_response_headers() -> HeaderMap {
    HeaderMap::from_iter([
        (
            http::header::CONTENT_TYPE,
            HeaderValue::from_str("text/event-stream; charset=utf-8").unwrap(),
        ),
        (
            http::header::CACHE_CONTROL,
            HeaderValue::from_str("no-cache").unwrap(),
        ),
        (
            http::header::CONNECTION,
            HeaderValue::from_str("keep-alive").unwrap(),
        ),
        (
            http::header::TRANSFER_ENCODING,
            HeaderValue::from_str("chunked").unwrap(),
        ),
    ])
}
