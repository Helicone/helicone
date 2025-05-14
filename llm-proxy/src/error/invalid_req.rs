use axum_core::response::IntoResponse;
use displaydoc::Display;
use http::{StatusCode, uri::InvalidUri};
use thiserror::Error;
use tracing::debug;

use crate::{
    error::api::ErrorResponse,
    types::{json::Json, provider::InferenceProvider},
};

/// User errors
#[derive(Debug, Error, Display, strum::AsRefStr)]
pub enum InvalidRequestError {
    /// Resource not found: {0}
    NotFound(String),
    /// Unsupported provider: {0}
    UnsupportedProvider(InferenceProvider),
    /// Router id not found: {0}
    RouterIdNotFound(String),
    /// Missing router id in request path
    MissingRouterId,
    /// Invalid request: {0}
    InvalidRequest(http::Error),
    /// Invalid request uri: {0}
    InvalidUri(#[from] InvalidUri),
    /// Invalid request body: {0}
    InvalidRequestBody(#[from] serde_json::Error),
    /// Upstream 4xx error: {0}
    Provider4xxError(StatusCode),
}

impl IntoResponse for InvalidRequestError {
    fn into_response(self) -> axum_core::response::Response {
        debug!(error = %self, "Invalid request");
        match self {
            Self::NotFound(path) => (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: format!("Not found: {path}"),
                }),
            )
                .into_response(),
            Self::RouterIdNotFound(router_id) => (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: format!("Router id not found: {router_id}"),
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
            Self::InvalidRequest(_) | Self::InvalidUri(_) => (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Invalid request".to_string(),
                }),
            )
                .into_response(),
            Self::UnsupportedProvider(provider) => (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Unsupported provider: {provider}"),
                }),
            )
                .into_response(),
            Self::InvalidRequestBody(e) => (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Invalid request body: {e}"),
                }),
            )
                .into_response(),
            Self::Provider4xxError(status) => (
                status,
                Json(ErrorResponse {
                    error: format!("Upstream 4xx error: {status}"),
                }),
            )
                .into_response(),
        }
    }
}
