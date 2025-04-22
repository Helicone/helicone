use axum_core::response::IntoResponse;
use displaydoc::Display;
use http::StatusCode;
use serde::Serialize;
use thiserror::Error;
use tracing::debug;
use utoipa::ToSchema;

use crate::types::{json::Json, response::Response};

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

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        match self {
            Error::InvalidRequest(error) => error.into_response(),
            Error::Authentication(error) => error.into_response(),
            Error::Internal(error) => error.into_response(),
            Error::Database(error) => {
                tracing::error!(error = %error, "Internal server error");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: "Internal server error".to_string(),
                    }),
                )
                    .into_response()
            }
            Error::Minio(error) => {
                tracing::error!(error = %error, "Internal server error");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: "Internal server error".to_string(),
                    }),
                )
                    .into_response()
            }
            Error::Box(error) => {
                tracing::error!(error = %error, "Internal server error");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: "Internal server error".to_string(),
                    }),
                )
                    .into_response()
            }
        }
    }
}

impl IntoResponse for InvalidRequestError {
    fn into_response(self) -> Response {
        debug!(error = %self, "Invalid request");
        match self {
            Self::NotFound => (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: "Not found".to_string(),
                }),
            )
                .into_response(),
            Self::InvalidRouterId(_) => (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Invalid router id".to_string(),
                }),
            )
                .into_response(),
            Self::MissingRouterId => (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Missing router id".to_string(),
                }),
            )
                .into_response(),
            Self::InvalidRequest(_) => (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Invalid request".to_string(),
                }),
            )
                .into_response(),
        }
    }
}
