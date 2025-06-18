pub(crate) mod converse;

use super::{Endpoint, EndpointType};
pub(crate) use crate::endpoints::bedrock::converse::Converse;
use crate::types::model_id::ModelId;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, strum::EnumIter)]
pub enum Bedrock {
    Converse(Converse),
}

impl Bedrock {
    #[must_use]
    pub fn path(self, model_id: &ModelId, is_stream: bool) -> String {
        match self {
            Self::Converse(_) => {
                if is_stream {
                    format!("/model/{model_id}/converse-stream")
                } else {
                    format!("/model/{model_id}/converse")
                }
            }
        }
    }

    #[must_use]
    pub fn converse() -> Self {
        Self::Converse(Converse)
    }

    #[must_use]
    pub fn endpoint_type(self) -> EndpointType {
        match self {
            Self::Converse(_) => EndpointType::Chat,
        }
    }
}

impl TryFrom<&str> for Bedrock {
    type Error = crate::error::invalid_req::InvalidRequestError;

    fn try_from(path: &str) -> Result<Self, Self::Error> {
        match path {
            Converse::PATH => Ok(Self::Converse(Converse)),
            path => {
                tracing::warn!(path = %path, "unsupported Bedrock path");
                Err(crate::error::invalid_req::InvalidRequestError::NotFound(
                    path.to_string(),
                ))
            }
        }
    }
}
