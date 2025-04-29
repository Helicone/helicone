use displaydoc::Display;
use thiserror::Error;

use crate::types::provider::Provider;

#[derive(Debug, Error, Display)]
pub enum ProviderError {
    /// Provider not set in global providers config: {0}
    ProviderNotConfigured(Provider),
    /// API Key not found for provider: {0}
    ApiKeyNotFound(Provider),
}
