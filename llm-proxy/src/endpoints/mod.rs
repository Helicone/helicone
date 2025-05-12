pub mod anthropic;
pub mod mappings;
pub mod openai;

pub trait Endpoint {
    const PATH: &'static str;
    type RequestBody;
    type ResponseBody;
}

use http::uri::PathAndQuery;

use crate::{
    endpoints::{anthropic::Anthropic, openai::OpenAI},
    error::invalid_req::InvalidRequestError,
    types::provider::InferenceProvider,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ApiEndpoint {
    OpenAI(OpenAI),
    Anthropic(Anthropic),
}

impl ApiEndpoint {
    pub fn new(
        path: &PathAndQuery,
        request_style: InferenceProvider,
    ) -> Result<Self, InvalidRequestError> {
        match request_style {
            InferenceProvider::OpenAI => {
                Ok(Self::OpenAI(OpenAI::try_from(path)?))
            }
            InferenceProvider::Anthropic => {
                Ok(Self::Anthropic(Anthropic::try_from(path)?))
            }
            unsupported => {
                tracing::warn!(provider = %unsupported, "Unsupported provider");
                Err(InvalidRequestError::UnsupportedProvider(unsupported))
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
}
