pub mod anthropic;
pub(crate) mod bedrock;
pub mod google;
pub mod mappings;
pub mod ollama;
pub mod openai;

use serde::{Deserialize, Serialize};

use crate::{
    endpoints::{
        anthropic::Anthropic, bedrock::Bedrock, google::Google, ollama::Ollama,
        openai::OpenAI,
    },
    error::{
        internal::InternalError, invalid_req::InvalidRequestError,
        mapper::MapperError,
    },
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
    Bedrock(Bedrock),
}

impl ApiEndpoint {
    #[must_use]
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
                Some(Self::Bedrock(Bedrock::try_from(path).ok()?))
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
            (Self::OpenAI(source), InferenceProvider::GoogleGemini) => {
                Ok(Self::Google(Google::from(source)))
            }
            (Self::OpenAI(source), InferenceProvider::Ollama) => {
                Ok(Self::Ollama(Ollama::from(source)))
            }
            (Self::OpenAI(source), InferenceProvider::Bedrock) => {
                Ok(Self::Bedrock(Bedrock::from(source)))
            }
            _ => {
                // only openai SDK is supported for now
                Err(InvalidRequestError::UnsupportedProvider(target_provider))
            }
        }
    }

    #[must_use]
    pub fn provider(&self) -> InferenceProvider {
        match self {
            Self::OpenAI(_) => InferenceProvider::OpenAI,
            Self::Anthropic(_) => InferenceProvider::Anthropic,
            Self::Google(_) => InferenceProvider::GoogleGemini,
            Self::Ollama(_) => InferenceProvider::Ollama,
            Self::Bedrock(_) => InferenceProvider::Bedrock,
        }
    }

    pub fn path(
        &self,
        model_id: Option<&ModelId>,
        is_stream: bool,
    ) -> Result<String, InternalError> {
        match self {
            Self::OpenAI(openai) => Ok(openai.path().to_string()),
            Self::Anthropic(anthropic) => Ok(anthropic.path().to_string()),
            Self::Google(google) => Ok(google.path().to_string()),
            Self::Ollama(ollama) => Ok(ollama.path().to_string()),
            Self::Bedrock(bedrock) => {
                if let Some(model_id) = model_id {
                    Ok(bedrock.path(model_id, is_stream))
                } else {
                    tracing::error!("Bedrock path requires model id");
                    Err(InternalError::Internal)
                }
            }
        }
    }

    #[must_use]
    pub fn endpoint_type(&self) -> EndpointType {
        match self {
            Self::OpenAI(openai) => openai.endpoint_type(),
            Self::Anthropic(anthropic) => anthropic.endpoint_type(),
            Self::Google(google) => google.endpoint_type(),
            Self::Ollama(ollama) => ollama.endpoint_type(),
            Self::Bedrock(bedrock) => bedrock.endpoint_type(),
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
