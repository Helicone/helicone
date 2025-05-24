use displaydoc::Display;
use thiserror::Error;

use crate::types::{provider::InferenceProvider, router::RouterId};

#[derive(Debug, Error, Display)]
pub enum ProviderError {
    /// Provider not set in global providers config: {0}
    ProviderNotConfigured(InferenceProvider),
    /// API Key not found for provider: {0}
    ApiKeyNotFound(InferenceProvider),
    /// Provider keys not found for router: {0}
    ProviderKeysNotFound(RouterId),
}
