pub mod chat;

use super::EndpointType;
pub use crate::endpoints::openai::chat_completions::ChatCompletions;
use crate::{
    endpoints::{Endpoint, ollama::chat::Chat, openai::OpenAI},
    error::invalid_req::InvalidRequestError,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, strum::EnumIter)]
pub enum Ollama {
    Chat(Chat),
}

impl Ollama {
    #[must_use]
    pub fn path(&self) -> &str {
        match self {
            Self::Chat(_) => Chat::PATH,
        }
    }

    #[must_use]
    pub fn chat() -> Self {
        Self::Chat(Chat)
    }

    #[must_use]
    pub fn endpoint_type(&self) -> EndpointType {
        match self {
            Self::Chat(_) => EndpointType::Chat,
        }
    }
}

impl TryFrom<&str> for Ollama {
    type Error = InvalidRequestError;

    fn try_from(path: &str) -> Result<Self, Self::Error> {
        match path {
            Chat::PATH => Ok(Self::Chat(Chat)),
            path => {
                tracing::debug!(path = %path, "unsupported ollama path");
                Err(InvalidRequestError::NotFound(path.to_string()))
            }
        }
    }
}

impl From<OpenAI> for Ollama {
    fn from(value: OpenAI) -> Self {
        match value {
            OpenAI::ChatCompletions(_) => Self::chat(),
        }
    }
}

impl From<Ollama> for OpenAI {
    fn from(value: Ollama) -> Self {
        match value {
            Ollama::Chat(_) => Self::chat_completions(),
        }
    }
}
