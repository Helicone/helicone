pub mod chat_completions;
use http::uri::PathAndQuery;

pub use crate::endpoints::openai::chat_completions::ChatCompletions;
use crate::{endpoints::Endpoint, error::invalid_req::InvalidRequestError};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum OpenAI {
    ChatCompletions(ChatCompletions),
}

impl OpenAI {
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
}

impl TryFrom<&PathAndQuery> for OpenAI {
    type Error = InvalidRequestError;

    fn try_from(value: &PathAndQuery) -> Result<Self, Self::Error> {
        match value.path() {
            ChatCompletions::PATH => Ok(Self::ChatCompletions(ChatCompletions)),
            path => {
                tracing::warn!(path = %path, "unsupported openai path");
                Err(InvalidRequestError::NotFound(path.to_string()))
            }
        }
    }
}
