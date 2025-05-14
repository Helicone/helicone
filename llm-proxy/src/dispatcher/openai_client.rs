use std::pin::Pin;

use async_openai::error::OpenAIError;
use futures::{Stream, stream::StreamExt};
use http::{HeaderMap, HeaderValue};
use reqwest::{ClientBuilder, RequestBuilder};
use reqwest_eventsource::{Event, EventSource, RequestBuilderExt};
use serde::de::DeserializeOwned;

use crate::{
    app::AppState,
    error::{init::InitError, provider::ProviderError},
    types::{provider::InferenceProvider, secret::Secret},
    utils::host_header,
};

pub(crate) type OpenAIStream<O> =
    Pin<Box<dyn Stream<Item = Result<O, OpenAIError>> + Send>>;

#[derive(Debug, Clone, Default)]
pub struct Client(pub(super) reqwest::Client);

impl Client {
    pub fn new(
        app_state: &AppState,
        client_builder: ClientBuilder,
        api_key: &Secret<String>,
    ) -> Result<Self, InitError> {
        let base_url = app_state
            .0
            .config
            .providers
            .get(&InferenceProvider::OpenAI)
            .ok_or(ProviderError::ProviderNotConfigured(
                InferenceProvider::OpenAI,
            ))?
            .base_url
            .clone();

        let mut default_headers = HeaderMap::new();
        default_headers.insert(
            http::header::AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", api_key.0)).unwrap(),
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
    ) -> Result<OpenAIStream<O>, OpenAIError>
    where
        B: Into<reqwest::Body>,
        O: DeserializeOwned + std::marker::Send + 'static,
    {
        let event_source = request_builder
            .body(body)
            .eventsource()
            .map_err(|e| OpenAIError::StreamError(e.to_string()))?;
        Ok(stream(event_source))
    }
}

/// Request which responds with SSE.
/// [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format)
pub(crate) fn stream<O>(mut event_source: EventSource) -> OpenAIStream<O>
where
    O: DeserializeOwned + std::marker::Send + 'static,
{
    let (tx, rx) = tokio::sync::mpsc::unbounded_channel();

    tokio::spawn(async move {
        while let Some(ev) = event_source.next().await {
            match ev {
                Err(e) => {
                    if let Err(_e) =
                        tx.send(Err(OpenAIError::StreamError(e.to_string())))
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
) -> OpenAIError {
    tracing::error!(
        "failed deserialization of: {}",
        String::from_utf8_lossy(bytes)
    );
    OpenAIError::JSONDeserialize(e)
}
