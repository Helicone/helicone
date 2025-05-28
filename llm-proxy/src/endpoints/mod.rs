pub mod anthropic;
pub mod mappings;
pub mod openai;

use serde::{Deserialize, Serialize};

use crate::{
    endpoints::{anthropic::Anthropic, openai::OpenAI},
    error::invalid_req::InvalidRequestError,
    middleware::mapper::error::MapperError,
    types::{model::Model, provider::InferenceProvider},
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
    fn model(&self) -> Result<Model, MapperError>;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ApiEndpoint {
    OpenAI(OpenAI),
    Anthropic(Anthropic),
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
            unsupported => {
                tracing::debug!(provider = %unsupported, "Provider not supported for request mapping");
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
            _ => Err(InvalidRequestError::UnsupportedProvider(target_provider)),
        }
    }

    #[must_use]
    pub fn provider(&self) -> InferenceProvider {
        match self {
            Self::OpenAI(_) => InferenceProvider::OpenAI,
            Self::Anthropic(_) => InferenceProvider::Anthropic,
        }
    }

    #[must_use]
    pub fn path(&self) -> &str {
        match self {
            Self::OpenAI(openai) => openai.path(),
            Self::Anthropic(anthropic) => anthropic.path(),
        }
    }

    #[must_use]
    pub fn endpoint_type(&self) -> EndpointType {
        match self {
            Self::OpenAI(openai) => openai.endpoint_type(),
            Self::Anthropic(anthropic) => anthropic.endpoint_type(),
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
