use crate::{
    error::invalid_req::InvalidRequestError,
    types::{provider::Provider, router::ExtractedPathAndQuery},
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ApiEndpoint {
    OpenAI(OpenAI),
    Anthropic(Anthropic),
}

impl ApiEndpoint {
    pub fn new(
        path: ExtractedPathAndQuery,
        provider: Provider,
    ) -> Result<Self, InvalidRequestError> {
        match provider {
            Provider::OpenAI => Ok(Self::OpenAI(OpenAI::try_from(path)?)),
            Provider::Anthropic => {
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
        target_provider: Provider,
    ) -> Result<Self, InvalidRequestError> {
        match (source_endpoint, target_provider) {
            (Self::OpenAI(source), Provider::Anthropic) => {
                Ok(Self::Anthropic(Anthropic::from(source)))
            }
            (Self::Anthropic(source), Provider::OpenAI) => {
                Ok(Self::OpenAI(OpenAI::from(source)))
            }
            _ => Err(InvalidRequestError::UnsupportedProvider(target_provider)),
        }
    }

    pub fn provider(&self) -> Provider {
        match self {
            Self::OpenAI(_) => Provider::OpenAI,
            Self::Anthropic(_) => Provider::Anthropic,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum OpenAI {
    ChatCompletions,
    Responses,
    LegacyCompletions,
}

impl TryFrom<ExtractedPathAndQuery> for OpenAI {
    type Error = InvalidRequestError;

    fn try_from(value: ExtractedPathAndQuery) -> Result<Self, Self::Error> {
        match value.as_ref().path() {
            "/v1/chat/completions" => return Ok(Self::ChatCompletions),
            "/v1/completions" => return Ok(Self::LegacyCompletions),
            path => Err(InvalidRequestError::NotFound(path.to_string())),
        }
    }
}

impl From<Anthropic> for OpenAI {
    fn from(value: Anthropic) -> Self {
        match value {
            Anthropic::Messages => Self::ChatCompletions,
            Anthropic::LegacyCompletions => Self::LegacyCompletions,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Anthropic {
    Messages,
    LegacyCompletions,
}

impl TryFrom<ExtractedPathAndQuery> for Anthropic {
    type Error = InvalidRequestError;

    fn try_from(value: ExtractedPathAndQuery) -> Result<Self, Self::Error> {
        match value.as_ref().path() {
            "/v1/messages" => return Ok(Self::Messages),
            "/v1/completions" => return Ok(Self::LegacyCompletions),
            path => Err(InvalidRequestError::NotFound(path.to_string())),
        }
    }
}

impl From<OpenAI> for Anthropic {
    fn from(value: OpenAI) -> Self {
        match value {
            OpenAI::ChatCompletions => Self::Messages,
            OpenAI::Responses => Self::Messages,
            OpenAI::LegacyCompletions => Self::LegacyCompletions,
        }
    }
}
