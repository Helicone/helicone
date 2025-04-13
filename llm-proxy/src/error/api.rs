use displaydoc::Display;
use serde::Serialize;
use thiserror::Error;
use utoipa::ToSchema;

/// User errors
#[derive(Debug, Error, Display, strum::AsRefStr, ToSchema)]
pub enum InvalidRequestError {
    /// Resource not found
    NotFound,
}

/// Common API errors
#[derive(Debug, Error, Display, strum::AsRefStr)]
pub enum Error {
    /// Invalid request: {0}
    InvalidRequest(#[from] InvalidRequestError),
    /// Database error: {0}
    Database(#[from] crate::error::database::DatabaseError),
    /// Minio error: {0}
    Minio(#[from] minio_rsc::error::Error),
    /// Authentication error: {0}
    Authentication(#[from] crate::error::auth::AuthError),
    /// Internal error: {0}
    Internal(#[from] crate::error::internal::InternalError),
}

/// The struct returned to the user in the case of an internal error.
/// When the remote backend API providers return an error, the error
/// struct is returned transparently to the user.
#[derive(Debug, Serialize, ToSchema)]
pub struct ErrorResponse {
    pub error: String,
}
