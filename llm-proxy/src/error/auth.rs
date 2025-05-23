use axum_core::response::{IntoResponse, Response};
use displaydoc::Display;
use http::StatusCode;
use tracing::error;

use super::api::ErrorResponse;
use crate::types::json::Json;

#[derive(Debug, strum::AsRefStr, thiserror::Error, Display)]
pub enum AuthError {
    /// Reqwest error: {0}
    Reqwest(#[from] reqwest::Error),
    /// Missing authorization header
    MissingAuthorizationHeader,
    /// Invalid credentials
    InvalidCredentials,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        match self {
            Self::Reqwest(error) => {
                error!(error = %error, "reqwest error");
                (
                    error.status().unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
                    Json(ErrorResponse {
                        error: "Authentication error".to_string(),
                    }),
                )
                    .into_response()
            }
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
