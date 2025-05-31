//!
//! `OpenAI`:
//! - /v1/chat/completions
//! - /v1/completions
//! - /v1/responses
//!
//! Anthropic:
//! - /v1/completions
//! - /v1/messages
//!
//! Provider | Primary REST path(s) you hit
//! `OpenAI` | POST <https://api.openai.com/v1/chat/completions> – chat / function calling The Customize Windows  POST <https://api.openai.com/v1/embeddings> – vector embeddings `OpenAI` Xiniushu  POST <https://api.openai.com/v1/images/generations> – DALL·E / GPT-Image `OpenAI` Community
//! Anthropic (Claude) | POST <https://api.anthropic.com/v1/messages> – Claude 3+ chat endpoint Anthropic Docs  POST <https://api.anthropic.com/v1/embeddings> – embeddings (beta) Anthropic Docs  Legacy: POST /v1/complete Anthropic Docs
//! Google Vertex AI (Gemini) | POST <https://{REGION}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models/{model}:generateContent> – text/vision/multimodal Google Cloud
//! Amazon Bedrock | POST <https://bedrock-runtime.{region}.amazonaws.com/model/{modelId}/invoke> – unified `InvokeModel` for every FM AWS Documentation
//! Azure `OpenAI` | POST <https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version=YYYY-MM-DD> – same payloads as `OpenAI`, Azure-flavored URL Microsoft Learn
//! Mistral AI | POST <https://api.mistral.ai/v1/chat/completions> – chat/agents/Codestral Mistral Docs  POST <https://api.mistral.ai/v1/embeddings> – embeddings Mistral Docs
//! Cohere | POST <https://api.cohere.com/v2/chat> – chat + RAG connectors Cohere  POST <https://api.cohere.com/v2/embed> – embeddings Cohere
//! Hugging Face (Serverless Inference) | POST <https://api-inference.huggingface.co/models/{model>} – run any Hub model Hugging Face Forums
//! Stability AI (Stable Image v2beta) | POST <https://api.stability.ai/v2beta/stable-image/generate/{quality>} – SD 3.5/SD3 image generation (ultra, sd3, etc.) Stability AI
//!
//! `TryFrom` req path to some struct/enum that represents an Ai Api Endpoint,
//! this struct then helps us deserialize to the correct type and then
//! call the `TryConvert` fn.
pub mod anthropic;
pub mod error;
mod gemini;
pub mod model;
pub mod openai;
pub mod registry;
pub mod service;

use bytes::Bytes;
use error::MapperError;
use serde::{Serialize, de::DeserializeOwned};

pub use self::service::*;
use crate::{
    endpoints::{AiRequest, Endpoint},
    error::{
        api::ApiError, internal::InternalError,
        invalid_req::InvalidRequestError,
    },
    types::request::MapperContext,
};

/// `TryFrom` but allows us to implement it for foreign types, so we can
/// maintain boundaries between our business logic and the provider types.
pub trait TryConvert<Source, Target>: Sized {
    type Error;

    fn try_convert(
        &self,
        value: Source,
    ) -> std::result::Result<Target, Self::Error>;
}

pub trait TryConvertStreamData<Source, Target>: Sized {
    type Error;

    /// Returns `None` if the chunk in `value` cannot be converted to an
    /// equivalent chunk in `Target`.
    fn try_convert_chunk(
        &self,
        value: Source,
    ) -> std::result::Result<Option<Target>, Self::Error>;
}
pub trait EndpointConverter {
    /// Convert a request body to a target request body with raw bytes.
    ///
    /// `MapperContext` is used to determine if the request is a stream
    /// since within the converter we have deserialized the request
    /// bytes to a concrete type.
    fn convert_req_body(
        &self,
        req_body_bytes: Bytes,
    ) -> Result<(Bytes, MapperContext), ApiError>;
    /// Convert a response body to a target response body with raw bytes.
    ///
    /// Returns `None` if there is no applicable mapping for a given chunk
    /// when converting stream response bodies.
    fn convert_resp_body(
        &self,
        resp_body_bytes: Bytes,
        is_stream: bool,
    ) -> Result<Option<Bytes>, ApiError>;
}

pub struct TypedEndpointConverter<S, T, C>
where
    S: Endpoint,
    T: Endpoint,
    C: TryConvert<S::RequestBody, T::RequestBody>
        + TryConvert<T::ResponseBody, S::ResponseBody>,
{
    converter: C,
    _phantom: std::marker::PhantomData<(S, T)>,
}

impl<S, T, C> TypedEndpointConverter<S, T, C>
where
    S: Endpoint,
    T: Endpoint,
    C: TryConvert<S::RequestBody, T::RequestBody>,
    C: TryConvert<T::ResponseBody, S::ResponseBody>,
{
    pub fn new(converter: C) -> Self {
        Self {
            converter,
            _phantom: std::marker::PhantomData,
        }
    }
}

impl<S, T, C> EndpointConverter for TypedEndpointConverter<S, T, C>
where
    S: Endpoint,
    S::RequestBody: DeserializeOwned + AiRequest,
    S::ResponseBody: Serialize,
    S::StreamResponseBody: Serialize,
    T: Endpoint,
    T::RequestBody: Serialize + AiRequest,
    T::ResponseBody: DeserializeOwned,
    T::StreamResponseBody: DeserializeOwned,
    C: TryConvert<S::RequestBody, T::RequestBody>,
    C: TryConvert<T::ResponseBody, S::ResponseBody>,
    C: TryConvertStreamData<T::StreamResponseBody, S::StreamResponseBody>,
    <C as TryConvert<S::RequestBody, T::RequestBody>>::Error: Into<MapperError>,
    <C as TryConvert<T::ResponseBody, S::ResponseBody>>::Error: Into<MapperError>,
    <C as TryConvertStreamData<T::StreamResponseBody, S::StreamResponseBody>>::Error:
        Into<MapperError>,
{
    fn convert_req_body(
        &self,
        bytes: Bytes,
    ) -> Result<(Bytes, MapperContext), ApiError> {
        let source_request: S::RequestBody = serde_json::from_slice(&bytes)
            .map_err(InvalidRequestError::InvalidRequestBody)?;
        let is_stream = source_request.is_stream();
        let target_request: T::RequestBody = self
            .converter
            .try_convert(source_request)
            .map_err(|e| InternalError::MapperError(e.into()))?;
        let model = target_request.model().map_err(InternalError::MapperError)?;
        let mapper_ctx = MapperContext { is_stream, model: Some(model) };
        let target_bytes =
            Bytes::from(serde_json::to_vec(&target_request).map_err(|e| {
                InternalError::Serialize {
                    ty: std::any::type_name::<T::RequestBody>(),
                    error: e,
                }
            })?);

        Ok((target_bytes, mapper_ctx))
    }

    fn convert_resp_body(&self, bytes: Bytes, is_stream: bool) -> Result<Option<Bytes>, ApiError> {
        if is_stream {
            let source_response: T::StreamResponseBody =
                serde_json::from_slice(&bytes)
                    .map_err(InvalidRequestError::InvalidRequestBody)?;
            let target_response: Option<S::StreamResponseBody> = self
                .converter
                .try_convert_chunk(source_response)
                .map_err(|e| InternalError::MapperError(e.into()))?;

            if let Some(target_response) = target_response {
                let target_bytes =
                serde_json::to_vec(&target_response).map_err(|e| {
                    InternalError::Serialize {
                        ty: std::any::type_name::<T::ResponseBody>(),
                        error: e,
                    }
                })?;

                Ok(Some(Bytes::from(target_bytes)))
            } else {
                Ok(None)
            }
        } else {
            let source_response: T::ResponseBody =
            serde_json::from_slice(&bytes)
                .map_err(InvalidRequestError::InvalidRequestBody)?;
            let target_response: S::ResponseBody = self
            .converter
            .try_convert(source_response)
            .map_err(|e| InternalError::MapperError(e.into()))?;

            let target_bytes =
            serde_json::to_vec(&target_response).map_err(|e| {
                InternalError::Serialize {
                    ty: std::any::type_name::<T::ResponseBody>(),
                    error: e,
                }
            })?;

            Ok(Some(Bytes::from(target_bytes)))
        }
    }
}

pub struct NoOpConverter<S>
where
    S: Endpoint,
    S::RequestBody: AiRequest,
{
    _phantom: std::marker::PhantomData<S>,
}

impl<S> Default for NoOpConverter<S>
where
    S: Endpoint,
    S::RequestBody: AiRequest,
{
    fn default() -> Self {
        Self::new()
    }
}

impl<S> NoOpConverter<S>
where
    S: Endpoint,
    S::RequestBody: AiRequest,
{
    #[must_use]
    pub fn new() -> Self {
        Self {
            _phantom: std::marker::PhantomData,
        }
    }
}

impl<S> EndpointConverter for NoOpConverter<S>
where
    S: Endpoint,
    S::RequestBody: DeserializeOwned + AiRequest,
{
    fn convert_req_body(
        &self,
        bytes: Bytes,
    ) -> Result<(Bytes, MapperContext), ApiError> {
        let source_request: S::RequestBody = serde_json::from_slice(&bytes)
            .map_err(InvalidRequestError::InvalidRequestBody)?;
        let is_stream = source_request.is_stream();
        let model =
            source_request.model().map_err(InternalError::MapperError)?;
        let mapper_ctx = MapperContext {
            is_stream,
            model: Some(model),
        };
        Ok((bytes, mapper_ctx))
    }

    fn convert_resp_body(
        &self,
        bytes: Bytes,
        _is_stream: bool,
    ) -> Result<Option<Bytes>, ApiError> {
        Ok(Some(bytes))
    }
}
