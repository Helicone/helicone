use displaydoc::Display;
use thiserror::Error;

use crate::types::provider::Provider;

/// Error types that can occur when mapping requests between providers.
#[derive(Debug, Error, Display)]
pub enum MapperError {
    /// Failed to convert chat completion request: {0}
    ChatConversion(ChatConversion),
    /// No model mapping found for provider: {0} and model: {1}
    NoModelMapping(Provider, String),
}

/// Error types that can occur when mapping requests between providers for chat
/// completions.
#[derive(Debug, Error)]
pub enum ChatConversion {}
