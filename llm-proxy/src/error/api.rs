use displaydoc::Display;
use serde::Serialize;
use thiserror::Error;
use utoipa::ToSchema;

use crate::types::response::Response;

/// User errors
#[derive(Debug, Error, Display, strum::AsRefStr)]
pub enum InvalidRequestError {
    /// Resource not found
    NotFound,
    /// Invalid router id in request path: {0}
    InvalidRouterId(#[from] uuid::Error),
    /// Missing router id in request path
    MissingRouterId,
    /// Invalid request: {0}
    InvalidRequest(http::Error),
}

/// Common API errors
#[derive(Debug, Error, Display, strum::AsRefStr)]
pub enum Error {
    /// Invalid request: {0}
    InvalidRequest(#[from] InvalidRequestError),
    /// Database error: {0}
    Database(#[from] sqlx::Error),
    /// Minio error: {0}
    Minio(#[from] minio_rsc::error::Error),
    /// Authentication error: {0}
    Authentication(#[from] crate::error::auth::AuthError),
    /// Internal error: {0}
    Internal(#[from] crate::error::internal::InternalError),
    /// Box: {0}
    Box(#[from] Box<dyn std::error::Error + Send + Sync>),
}

/// The struct returned to the user in the case of an internal error.
/// When the remote backend API providers return an error, the error
/// struct is returned transparently to the user.
#[derive(Debug, Serialize, ToSchema)]
pub struct ErrorResponse {
    pub error: String,
}

impl From<Error> for Response {
    fn from(_error: Error) -> Self {
        todo!()
    }
}
