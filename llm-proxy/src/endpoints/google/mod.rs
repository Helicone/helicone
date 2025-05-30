mod generate_contents;

use super::{Endpoint, EndpointType};
pub(crate) use crate::endpoints::google::generate_contents::GenerateContents;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, strum::EnumIter)]
pub enum Google {
    GenerateContents(GenerateContents),
}

impl Google {
    #[must_use]
    pub fn path(&self) -> &str {
        match self {
            Self::GenerateContents(_) => GenerateContents::PATH,
        }
    }

    #[must_use]
    pub fn generate_contents() -> Self {
        Self::GenerateContents(GenerateContents)
    }

    #[must_use]
    pub fn endpoint_type(&self) -> EndpointType {
        match self {
            Self::GenerateContents(_) => EndpointType::Chat,
        }
    }
}

impl TryFrom<&str> for Google {
    type Error = crate::error::invalid_req::InvalidRequestError;

    fn try_from(path: &str) -> Result<Self, Self::Error> {
        match path {
            GenerateContents::PATH => {
                Ok(Self::GenerateContents(GenerateContents))
            }
            path => {
                tracing::warn!(path = %path, "unsupported Google path");
                Err(crate::error::invalid_req::InvalidRequestError::NotFound(
                    path.to_string(),
                ))
            }
        }
    }
}
