use displaydoc::Display;
use thiserror::Error;

/// Internal errors
#[derive(Debug, Error, Display, strum::AsRefStr)]
pub enum InternalError {
    /// Internal error
    Internal,

    /// Request context not found
    RequestContextNotFound,
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
