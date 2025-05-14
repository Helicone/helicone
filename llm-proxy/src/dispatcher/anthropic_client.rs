use std::pin::Pin;

use futures::{Stream, stream::StreamExt};
use http::{HeaderMap, HeaderName, HeaderValue};
use reqwest::{ClientBuilder, RequestBuilder};
use reqwest_eventsource::{Event, EventSource, RequestBuilderExt};
use serde::de::DeserializeOwned;

use crate::{
    app::AppState,
    config::providers::DEFAULT_ANTHROPIC_VERSION,
    error::{init::InitError, provider::ProviderError},
    types::{provider::InferenceProvider, secret::Secret},
    utils::host_header,
};

pub(crate) type AnthropicStream<O> =
    Pin<Box<dyn Stream<Item = Result<O, AnthropicError>> + Send>>;

#[derive(Debug, thiserror::Error)]
pub enum AnthropicError {
    /// Underlying error from reqwest library after an API call was made
    #[error("http error: {0}")]
    Reqwest(#[from] reqwest::Error),
    /// Error when a response cannot be deserialized into a Rust type
    #[error("failed to deserialize api response: {0}")]
    JSONDeserialize(serde_json::Error),
    /// Error on SSE streaming
    #[error("stream failed: {0}")]
    StreamError(String),
}

#[derive(Debug, Clone, Default)]
pub struct Client(pub(super) reqwest::Client);

impl Client {
    pub fn new(
        app_state: &AppState,
        client_builder: ClientBuilder,
        api_key: &Secret<String>,
    ) -> Result<Self, InitError> {
        let provider_config = app_state
            .0
            .config
            .providers
            .get(&InferenceProvider::Anthropic)
            .ok_or(ProviderError::ProviderNotConfigured(
                InferenceProvider::Anthropic,
            ))?;

        let base_url = provider_config.base_url.clone();
        let version = provider_config
            .version
            .as_deref()
            .unwrap_or(DEFAULT_ANTHROPIC_VERSION);

        let mut default_headers = HeaderMap::new();
        default_headers.insert(
            HeaderName::from_static("x-api-key"),
            HeaderValue::from_str(&api_key.0).unwrap(),
        );
        default_headers.insert(
            HeaderName::from_static("anthropic-version"),
            HeaderValue::from_str(version).unwrap(),
        );
        default_headers.insert(http::header::HOST, host_header(&base_url));

        let inner = client_builder
            .default_headers(default_headers)
            .build()
            .map_err(InitError::CreateReqwestClient)?;
        Ok(Self(inner))
    }

    #[allow(dead_code)]
    pub(crate) fn post_stream<B, O>(
        request_builder: RequestBuilder,
        body: B,
    ) -> Result<AnthropicStream<O>, AnthropicError>
    where
        B: Into<reqwest::Body>,
        O: DeserializeOwned + std::marker::Send + 'static,
    {
        let event_source = request_builder
            .body(body)
            .eventsource()
            .map_err(|e| AnthropicError::StreamError(e.to_string()))?;
        Ok(stream(event_source))
    }
}

/// Request which responds with SSE.
/// [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format)
pub(crate) fn stream<O>(mut event_source: EventSource) -> AnthropicStream<O>
where
    O: DeserializeOwned + std::marker::Send + 'static,
{
    let (tx, rx) = tokio::sync::mpsc::unbounded_channel();

    tokio::spawn(async move {
        while let Some(ev) = event_source.next().await {
            match ev {
                Err(e) => {
                    if let Err(_e) =
                        tx.send(Err(AnthropicError::StreamError(e.to_string())))
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

                        let response =
                            match serde_json::from_str::<O>(&message.data) {
                                Err(e) => Err(map_deserialization_error(
                                    e,
                                    message.data.as_bytes(),
                                )),
                                Ok(output) => Ok(output),
                            };

                        if let Err(_e) = tx.send(response) {
                            // rx dropped
                            break;
                        }
                    }
                    Event::Open => {}
                },
            }
        }

        event_source.close();
    });

    Box::pin(tokio_stream::wrappers::UnboundedReceiverStream::new(rx))
}

fn map_deserialization_error(
    e: serde_json::Error,
    bytes: &[u8],
) -> AnthropicError {
    tracing::error!(
        "failed deserialization of: {}",
        String::from_utf8_lossy(bytes)
    );
    AnthropicError::JSONDeserialize(e)
}
