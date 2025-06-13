pub mod anthropic;
pub mod google;
pub mod mappings;
pub mod ollama;
pub mod openai;

use serde::{Deserialize, Serialize};

use crate::{
    endpoints::{
        anthropic::Anthropic, google::Google, ollama::Ollama, openai::OpenAI,
    },
    error::invalid_req::InvalidRequestError,
    middleware::mapper::error::MapperError,
    types::{model_id::ModelId, provider::InferenceProvider},
};

pub trait Endpoint {
    const PATH: &'static str;
    type RequestBody;
    type ResponseBody;
    /// To support streaming response body types with different
    /// concrete type than the regular response body type.
    type StreamResponseBody;
}

pub trait AiRequest {
    fn is_stream(&self) -> bool;
    fn model(&self) -> Result<ModelId, MapperError>;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ApiEndpoint {
    OpenAI(OpenAI),
    Anthropic(Anthropic),
    Google(Google),
    Ollama(Ollama),
}

impl ApiEndpoint {
    pub fn new(path: &str, request_style: InferenceProvider) -> Option<Self> {
        match request_style {
            InferenceProvider::OpenAI => {
                Some(Self::OpenAI(OpenAI::try_from(path).ok()?))
            }
            InferenceProvider::Anthropic => {
                Some(Self::Anthropic(Anthropic::try_from(path).ok()?))
            }
            InferenceProvider::GoogleGemini => {
                Some(Self::Google(Google::try_from(path).ok()?))
            }
            InferenceProvider::Ollama => {
                Some(Self::Ollama(Ollama::try_from(path).ok()?))
            }
            InferenceProvider::Bedrock => {
                tracing::debug!("Provider not supported for request mapping");
                None
            }
        }
    }

    pub fn mapped(
        source_endpoint: ApiEndpoint,
        target_provider: InferenceProvider,
    ) -> Result<Self, InvalidRequestError> {
        match (source_endpoint, target_provider) {
            (Self::OpenAI(source), InferenceProvider::Anthropic) => {
                Ok(Self::Anthropic(Anthropic::from(source)))
            }
            (Self::Anthropic(source), InferenceProvider::OpenAI) => {
                Ok(Self::OpenAI(OpenAI::from(source)))
            }
            (Self::Google(source), InferenceProvider::OpenAI) => {
                Ok(Self::OpenAI(OpenAI::from(source)))
            }
            (Self::OpenAI(source), InferenceProvider::GoogleGemini) => {
                Ok(Self::Google(Google::from(source)))
            }
            (Self::OpenAI(source), InferenceProvider::Ollama) => {
                Ok(Self::Ollama(Ollama::from(source)))
            }
            (Self::Ollama(source), InferenceProvider::OpenAI) => {
                Ok(Self::OpenAI(OpenAI::from(source)))
            }
            _ => Err(InvalidRequestError::UnsupportedProvider(target_provider)),
        }
    }

    #[must_use]
    pub fn provider(&self) -> InferenceProvider {
        match self {
            Self::OpenAI(_) => InferenceProvider::OpenAI,
            Self::Anthropic(_) => InferenceProvider::Anthropic,
            Self::Google(_) => InferenceProvider::GoogleGemini,
            Self::Ollama(_) => InferenceProvider::Ollama,
        }
    }

    #[must_use]
    pub fn path(&self) -> &str {
        match self {
            Self::OpenAI(openai) => openai.path(),
            Self::Anthropic(anthropic) => anthropic.path(),
            Self::Google(google) => google.path(),
            Self::Ollama(ollama) => ollama.path(),
        }
    }

    #[must_use]
    pub fn endpoint_type(&self) -> EndpointType {
        match self {
            Self::OpenAI(openai) => openai.endpoint_type(),
            Self::Anthropic(anthropic) => anthropic.endpoint_type(),
            Self::Google(google) => google.endpoint_type(),
            Self::Ollama(ollama) => ollama.endpoint_type(),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum EndpointType {
    Chat,
    Image,
    Audio,
}
