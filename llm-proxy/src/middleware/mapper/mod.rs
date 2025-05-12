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
pub mod model;
pub mod openai;
pub mod registry;
pub mod service;

use bytes::Bytes;
use error::MapperError;
use serde::{Serialize, de::DeserializeOwned};

pub use self::service::*;
use crate::{
    endpoints::Endpoint,
    error::{
        api::Error, internal::InternalError, invalid_req::InvalidRequestError,
    },
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

pub trait Convert<Source>: Sized {
    fn convert(value: Source) -> Self;
}

pub trait EndpointConverter {
    /// Convert a request body to a target request body with raw bytes.
    fn convert_req_body(&self, req_body_bytes: &Bytes) -> Result<Bytes, Error>;
    /// Convert a response body to a target response body with raw bytes.
    fn convert_resp_body(
        &self,
        resp_body_bytes: &Bytes,
    ) -> Result<Bytes, Error>;
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
    S::RequestBody: DeserializeOwned,
    S::ResponseBody: Serialize,
    T: Endpoint,
    T::ResponseBody: DeserializeOwned,
    T::RequestBody: Serialize,
    C: TryConvert<S::RequestBody, T::RequestBody>,
    C: TryConvert<T::ResponseBody, S::ResponseBody>,
    <C as TryConvert<S::RequestBody, T::RequestBody>>::Error: Into<MapperError>,
    <C as TryConvert<T::ResponseBody, S::ResponseBody>>::Error:
        Into<MapperError>,
{
    fn convert_req_body(&self, bytes: &Bytes) -> Result<Bytes, Error> {
        let source_request: S::RequestBody = serde_json::from_slice(bytes)
            .map_err(InvalidRequestError::InvalidRequestBody)?;
        let target_request: T::RequestBody = self
            .converter
            .try_convert(source_request)
            .map_err(|e| InternalError::MapperError(e.into()))?;
        let target_bytes =
            serde_json::to_vec(&target_request).map_err(|e| {
                InternalError::Serialize {
                    ty: std::any::type_name::<T::RequestBody>(),
                    error: e,
                }
            })?;

        Ok(Bytes::from(target_bytes))
    }

    fn convert_resp_body(&self, bytes: &Bytes) -> Result<Bytes, Error> {
        let source_response: T::ResponseBody = serde_json::from_slice(bytes)
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

        Ok(Bytes::from(target_bytes))
    }
}
