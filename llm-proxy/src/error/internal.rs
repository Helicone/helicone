use displaydoc::Display;
use thiserror::Error;

use crate::types::provider::Provider;

/// Internal errors
#[derive(Debug, Error, Display, strum::AsRefStr)]
pub enum InternalError {
    /// Internal error
    Internal,
    /// Could not deserialize {ty} due to: {error}
    Deserialize {
        ty: &'static str,
        error: serde_json::Error,
    },
    /// Router config provider '{0}' not present in DispatcherConfig
    ProviderNotConfigured(Provider),
    /// Extension {0} not found
    ExtensionNotFound(&'static str),
    /// Provider not found
    ProviderNotFound,
    /// Could not collect response body
    CollectBodyError,
    /// Could not process request body: {0}
    RequestBodyError(Box<dyn std::error::Error + Send + Sync>),
    /// Reqwest error: {0}
    ReqwestError(#[from] reqwest::Error),
    /// Http error: {0}
    HttpError(#[from] http::Error),
    /// Mapper error: {0}
    MapperError(#[from] crate::mapper::error::MapperError),
}
