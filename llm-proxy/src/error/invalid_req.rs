use axum_core::response::IntoResponse;
use displaydoc::Display;
use http::StatusCode;
use thiserror::Error;
use tracing::debug;

use crate::{
    error::api::ErrorResponse,
    types::{json::Json, response::Response},
};

/// User errors
#[derive(Debug, Error, Display, strum::AsRefStr)]
pub enum InvalidRequestError {
    /// Resource not found
    NotFound,
    /// Invalid router id in request path: {0}
    InvalidRouterId(String),
    /// Missing router id in request path
    MissingRouterId,
    /// Invalid request: {0}
    InvalidRequest(http::Error),
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
