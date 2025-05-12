use displaydoc::Display;
use thiserror::Error;

use crate::types::provider::InferenceProvider;

/// Error types that can occur when mapping requests between providers.
#[derive(Debug, Error, Display)]
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
}
