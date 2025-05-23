use axum_core::response::IntoResponse;
use displaydoc::Display;
use http::StatusCode;
use serde::Serialize;
use thiserror::Error;
use utoipa::ToSchema;

use super::invalid_req::InvalidRequestError;
use crate::types::json::Json;

/// Common API errors
#[derive(Debug, Error, Display, strum::AsRefStr)]
pub enum Error {
    /// Invalid request: {0}
    InvalidRequest(#[from] InvalidRequestError),
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
    fn into_response(self) -> axum_core::response::Response {
        match self {
            Error::InvalidRequest(error) => error.into_response(),
            Error::Authentication(error) => error.into_response(),
            Error::Internal(error) => error.into_response(),
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
