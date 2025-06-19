pub mod chat_completions;

use super::EndpointType;
use crate::{
    endpoints::{Endpoint, ollama::chat_completions::ChatCompletions},
    error::invalid_req::InvalidRequestError,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, strum::EnumIter)]
pub enum Ollama {
    ChatCompletions(ChatCompletions),
}

impl Ollama {
    #[must_use]
    pub fn path(&self) -> &str {
        match self {
            Self::ChatCompletions(_) => ChatCompletions::PATH,
        }
    }

    #[must_use]
    pub fn chat_completions() -> Self {
        Self::ChatCompletions(ChatCompletions)
    }

    #[must_use]
    pub fn endpoint_type(&self) -> EndpointType {
        match self {
            Self::ChatCompletions(_) => EndpointType::Chat,
        }
    }
}

impl TryFrom<&str> for Ollama {
    type Error = InvalidRequestError;

    fn try_from(path: &str) -> Result<Self, Self::Error> {
        match path {
            ChatCompletions::PATH => Ok(Self::ChatCompletions(ChatCompletions)),
            path => {
                tracing::debug!(path = %path, "unsupported ollama path");
                Err(InvalidRequestError::NotFound(path.to_string()))
            }
        }
    }
}
