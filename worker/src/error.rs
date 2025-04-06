use thiserror::Error;

/// Error types that can occur during the request lifecycle.
#[derive(Debug, Error)]
pub enum Error {
    #[error("Request context not found")]
    RequestContextNotFound,
    #[error("Provider not found")]
    ProviderNotFound,
    #[error("Could not collect response body")]
    CollectBodyError,
    #[error("Could not process request body: {0}")]
    RequestBodyError(Box<dyn std::error::Error + Send + Sync>),
    #[error("Reqwest error: {0}")]
    ReqwestError(#[from] reqwest::Error),
    #[error("Http error: {0}")]
    HttpError(#[from] http::Error),
    #[error("Mapper error: {0}")]
    MapperError(#[from] crate::mapper::error::MapperError),
}
