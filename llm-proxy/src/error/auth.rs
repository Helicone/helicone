use axum_core::response::{IntoResponse, Response};
use displaydoc::Display;
use http::StatusCode;
use thiserror::Error;
use tracing::error;

use super::api::ErrorResponse;
use crate::types::json::Json;

#[derive(Debug, strum::AsRefStr, Error, Display)]
pub enum AuthError {
    /// Reqwest transport error: {0}
    Transport(#[from] reqwest::Error),
    /// Unsuccessful auth response: {0}
    UnsuccessfulAuthResponse(reqwest::Error),
    /// Missing authorization header
    MissingAuthorizationHeader,
    /// Invalid credentials
    InvalidCredentials,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        match self {
            Self::Transport(error) => {
                error!(error = %error, "reqwest transport error");
                (
                    error.status().unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
                    Json(ErrorResponse {
                        error: "Authentication error".to_string(),
                    }),
                )
                    .into_response()
            }
            Self::UnsuccessfulAuthResponse(error) => (
                error.status().unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
                Json(ErrorResponse {
                    error: "Authentication error".to_string(),
                }),
            )
                .into_response(),
            Self::MissingAuthorizationHeader => (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse {
                    error: Self::MissingAuthorizationHeader.to_string(),
                }),
            )
                .into_response(),
            Self::InvalidCredentials => (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse {
                    error: Self::InvalidCredentials.to_string(),
                }),
            )
                .into_response(),
        }
    }
}

/// Auth errors for metrics. This is a special type
/// that avoids including dynamic information to limit cardinality
/// such that we can use this type in metrics.
#[derive(Debug, Error, Display, strum::AsRefStr)]
pub enum AuthErrorMetric {
    /// Reqwest transport error
    Transport,
    /// Unsuccessful auth response
    UnsuccessfulAuthResponse,
    /// Missing authorization header
    MissingAuthorizationHeader,
    /// Invalid credentials
    InvalidCredentials,
    /// Invalid user id
    InvalidUserId,
    /// Invalid org id
    InvalidOrgId,
}

impl From<&AuthError> for AuthErrorMetric {
    fn from(error: &AuthError) -> Self {
        match error {
            AuthError::Transport(_) => Self::Transport,
            AuthError::UnsuccessfulAuthResponse(_) => {
                Self::UnsuccessfulAuthResponse
            }
            AuthError::MissingAuthorizationHeader => {
                Self::MissingAuthorizationHeader
            }
            AuthError::InvalidCredentials => Self::InvalidCredentials,
        }
    }
}
