use displaydoc::Display;
use thiserror::Error;

use crate::types::provider::Provider;

#[derive(Debug, Error, Display)]
pub enum ProviderError {
    /// Provider not supported: {0}
    ProviderNotSupported(Provider),
    /// API Key not found for provider: {0}
    ApiKeyNotFound(Provider),
}
