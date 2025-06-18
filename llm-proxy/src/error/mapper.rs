use displaydoc::Display;
use strum::AsRefStr;
use thiserror::Error;
use tower::BoxError;

use crate::types::provider::InferenceProvider;

/// Error types that can occur when mapping requests between providers.
#[derive(Debug, Error, Display, AsRefStr)]
pub enum MapperError {
    /// Failed to convert chat completion request
    ChatConversion,
    /// No model mapping found for provider: {0} and model: {1}
    NoModelMapping(InferenceProvider, String),
    /// Invalid model name: {0}
    InvalidModelName(String),
    /// No global provider config found for provider: {0}
    NoProviderConfig(InferenceProvider),
    /// Provider not enabled in router config: {0}
    ProviderNotEnabled(InferenceProvider),
    /// Invalid request body
    InvalidRequest,
    /// Serde error: {0}
    SerdeError(#[from] serde_json::Error),
    /// Underlying stream error: {0}
    StreamError(String),
    /// Empty response body
    EmptyResponseBody,
    /// Provider not supported: {0}
    ProviderNotSupported(String),
    /// Tool spec not found: {0}
    ToolMappingInvalid(String),
    /// Image mapping invalid: {0}
    ImageMappingInvalid(String),
    /// Failed to map Bedrock message: {0}
    FailedToMapBedrockMessage(BoxError),
}

/// Error types that can occur when mapping requests between providers.
#[derive(Debug, Error, Display, strum::AsRefStr)]
pub enum MapperErrorMetric {
    /// Failed to convert chat completion request
    ChatConversion,
    /// No model mapping found
    NoModelMapping,
    /// Invalid model name
    InvalidModelName,
    /// No global provider config found
    NoProviderConfig,
    /// Provider not enabled in router config
    ProviderNotEnabled,
    /// Invalid request body
    InvalidRequest,
    /// Serde error
    SerdeError,
    /// Underlying stream error
    StreamError,
    /// Empty response body
    EmptyResponseBody,
    /// Provider not supported
    ProviderNotSupported,
    /// Tool spec not found
    ToolMappingInvalid,
    /// Image mapping invalid
    ImageMappingInvalid,
    /// Failed to map Bedrock message
    FailedToMapBedrockMessage,
}

impl From<&MapperError> for MapperErrorMetric {
    fn from(error: &MapperError) -> Self {
        match error {
            MapperError::ChatConversion => Self::ChatConversion,
            MapperError::NoModelMapping(_, _) => Self::NoModelMapping,
            MapperError::InvalidModelName(_) => Self::InvalidModelName,
            MapperError::NoProviderConfig(_) => Self::NoProviderConfig,
            MapperError::ProviderNotEnabled(_) => Self::ProviderNotEnabled,
            MapperError::InvalidRequest => Self::InvalidRequest,
            MapperError::SerdeError(_) => Self::SerdeError,
            MapperError::StreamError(_) => Self::StreamError,
            MapperError::EmptyResponseBody => Self::EmptyResponseBody,
            MapperError::ProviderNotSupported(_) => Self::ProviderNotSupported,
            MapperError::ToolMappingInvalid(_) => Self::ToolMappingInvalid,
            MapperError::ImageMappingInvalid(_) => Self::ImageMappingInvalid,
            MapperError::FailedToMapBedrockMessage(_) => {
                Self::FailedToMapBedrockMessage
            }
        }
    }
}
