pub mod messages;
use http::uri::PathAndQuery;

use super::Endpoint;
pub use crate::endpoints::anthropic::messages::Messages;
use crate::error::invalid_req::InvalidRequestError;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Anthropic {
    Messages(Messages),
}

impl Anthropic {
    #[must_use]
    pub fn path(&self) -> &str {
        match self {
            Self::Messages(_) => Messages::PATH,
        }
    }

    #[must_use]
    pub fn messages() -> Self {
        Self::Messages(Messages)
    }
}

impl TryFrom<&PathAndQuery> for Anthropic {
    type Error = InvalidRequestError;

    fn try_from(value: &PathAndQuery) -> Result<Self, Self::Error> {
        match value.path() {
            Messages::PATH => Ok(Self::Messages(Messages)),
            path => {
                tracing::warn!(path = %path, "unsupported anthropic path");
                Err(InvalidRequestError::NotFound(path.to_string()))
            }
        }
    }
}
