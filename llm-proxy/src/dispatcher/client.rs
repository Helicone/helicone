use bytes::Bytes;
use futures::StreamExt;
use reqwest::RequestBuilder;
use reqwest_eventsource::{Event, EventSource, RequestBuilderExt};
use tracing::{Instrument, info_span};

use crate::{
    app_state::AppState,
    dispatcher::{
        SSEStream, anthropic_client::Client as AnthropicClient,
        bedrock_client::Client as BedrockClient,
        google_gemini_client::Client as GoogleGeminiClient,
        ollama_client::Client as OllamaClient,
        openai_client::Client as OpenAIClient,
    },
    error::{
        api::ApiError, init::InitError, internal::InternalError,
        provider::ProviderError,
    },
    types::{
        provider::{InferenceProvider, ProviderKey},
        router::RouterId,
    },
};

pub trait ProviderClient {
    fn extract_and_sign_aws_headers(
        &self,
        request_builder: reqwest::RequestBuilder,
        req_body_bytes: &bytes::Bytes,
    ) -> Result<reqwest::RequestBuilder, ApiError>;
}

impl ProviderClient for Client {
    fn extract_and_sign_aws_headers(
        &self,
        request_builder: reqwest::RequestBuilder,
        req_body_bytes: &bytes::Bytes,
    ) -> Result<reqwest::RequestBuilder, ApiError> {
        match self {
            Client::Bedrock(inner) => inner
                .extract_and_sign_aws_headers(request_builder, req_body_bytes),
            _ => Ok(request_builder),
        }
    }
}

#[derive(Debug, Clone)]
pub enum Client {
    OpenAI(OpenAIClient),
    Anthropic(AnthropicClient),
    GoogleGemini(GoogleGeminiClient),
    Ollama(OllamaClient),
    Bedrock(BedrockClient),
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

    fn new_inner(
        app_state: &AppState,
        inference_provider: InferenceProvider,
        api_key: Option<&ProviderKey>,
    ) -> Result<Self, InitError> {
        // connection timeout, timeout, etc.
        let base_client = reqwest::Client::builder()
            .connect_timeout(app_state.0.config.dispatcher.connection_timeout)
            .timeout(app_state.0.config.dispatcher.timeout)
            .tcp_nodelay(true);

        match (api_key, inference_provider) {
            (Some(api_key), InferenceProvider::OpenAI) => Ok(Self::OpenAI(
                OpenAIClient::new(app_state, base_client, api_key)?,
            )),
            (Some(api_key), InferenceProvider::Anthropic) => {
                Ok(Self::Anthropic(AnthropicClient::new(
                    app_state,
                    base_client,
                    api_key,
                )?))
            }
            (Some(api_key), InferenceProvider::GoogleGemini) => {
                Ok(Self::GoogleGemini(GoogleGeminiClient::new(
                    app_state,
                    base_client,
                    api_key,
                )?))
            }
            (Some(api_key), InferenceProvider::Bedrock) => Ok(Self::Bedrock(
                BedrockClient::new(app_state, base_client, api_key)?,
            )),
            (None | Some(_), InferenceProvider::Ollama) => {
                Ok(Self::Ollama(OllamaClient::new(app_state, base_client)?))
            }
            (None, _) => Err(InitError::ProviderError(
                ProviderError::ApiKeyNotFound(inference_provider),
            )),
        }
    }

    pub(crate) async fn new_for_router(
        app_state: &AppState,
        inference_provider: InferenceProvider,
        router_id: &RouterId,
    ) -> Result<Self, InitError> {
        if inference_provider == InferenceProvider::Ollama {
            return Self::new_inner(app_state, inference_provider, None);
        }
        let api_key = &app_state
            .get_provider_api_key_for_router(router_id, inference_provider)
            .await?;

        Self::new_inner(app_state, inference_provider, Some(api_key))
    }

    pub(crate) fn new_for_direct_proxy(
        app_state: &AppState,
        inference_provider: InferenceProvider,
    ) -> Result<Self, InitError> {
        if inference_provider == InferenceProvider::Ollama {
            return Self::new_inner(app_state, inference_provider, None);
        }
        let api_key = &app_state
            .get_provider_api_key_for_direct_proxy(inference_provider)?;

        Self::new_inner(app_state, inference_provider, Some(api_key))
    }

    pub(crate) fn new_for_unified_api(
        app_state: &AppState,
        inference_provider: InferenceProvider,
    ) -> Result<Self, InitError> {
        if inference_provider == InferenceProvider::Ollama {
            return Self::new_inner(app_state, inference_provider, None);
        }
        // we're cheating here but this will be changed soon for cloud hosted
        // version
        let api_key = &app_state
            .get_provider_api_key_for_direct_proxy(inference_provider)?;

        Self::new_inner(app_state, inference_provider, Some(api_key))
    }
}

impl AsRef<reqwest::Client> for Client {
    fn as_ref(&self) -> &reqwest::Client {
        match self {
            Client::OpenAI(client) => &client.0,
            Client::Anthropic(client) => &client.0,
            Client::GoogleGemini(client) => &client.0,
            Client::Ollama(client) => &client.0,
            Client::Bedrock(client) => &client.inner,
        }
    }
}

/// Request which responds with SSE.
/// [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format)
pub(super) fn sse_stream(mut event_source: EventSource) -> SSEStream {
    let (tx, rx) = tokio::sync::mpsc::unbounded_channel();

    tokio::spawn(
        async move {
            while let Some(ev) = event_source.next().await {
                match ev {
                    Err(e) => {
                        if let Err(_e) = tx
                            .send(Err(InternalError::StreamError(Box::new(e))))
                        {
                            // rx dropped
                            break;
                        }
                    }
                    Ok(event) => match event {
                        Event::Message(message) => {
                            if message.data == "[DONE]" {
                                break;
                            }

                            let data = Bytes::from(message.data);

                            if let Err(_e) = tx.send(Ok(data)) {
                                // rx dropped
                                break;
                            }
                        }
                        Event::Open => {}
                    },
                }
            }

            event_source.close();
        }
        .instrument(info_span!("sse_stream")),
    );

    Box::pin(tokio_stream::wrappers::UnboundedReceiverStream::new(rx))
}
