use displaydoc::Display;
use thiserror::Error;

/// Error types that can occur when mapping requests between providers.
#[derive(Debug, Error, Display)]
pub enum MapperError {
    /// Failed to convert chat completion request: {0}
    ChatConversion(ChatConversion),
}

/// Error types that can occur when mapping requests between providers for chat
/// completions.
#[derive(Debug, Error)]
pub enum ChatConversion {}
