use axum_core::response::{IntoResponse, Response};
use displaydoc::Display;
use http::StatusCode;
use thiserror::Error;
use tower::BoxError;
use tracing::error;

use crate::{
    endpoints::ApiEndpoint,
    error::api::ErrorResponse,
    types::{json::Json, provider::InferenceProvider},
};

/// Internal errors
#[derive(Debug, Error, Display, strum::AsRefStr)]
pub enum InternalError {
    /// Internal error
    Internal,
    /// Could not serialize {ty} due to: {error}
    Serialize {
        ty: &'static str,
        error: serde_json::Error,
    },
    /// Could not deserialize {ty} due to: {error}
    Deserialize {
        ty: &'static str,
        error: serde_json::Error,
    },
    /// Router config provider '{0}' not present in `ProvidersConfig`
    ProviderNotConfigured(InferenceProvider),
    /// Extension {0} not found
    ExtensionNotFound(&'static str),
    /// Provider not found
    ProviderNotFound,
    /// Could not collect response body: {0}
    CollectBodyError(axum_core::Error),
    /// Could not process request body: {0}
    RequestBodyError(Box<dyn std::error::Error + Send + Sync>),
    /// Reqwest error: {0}
    ReqwestError(#[from] reqwest::Error),
    /// Http error: {0}
    HttpError(#[from] http::Error),
    /// Mapper error: {0}
    MapperError(#[from] crate::middleware::mapper::error::MapperError),
    /// Load balancer error: {0}
    LoadBalancerError(BoxError),
    /// Poll ready error: {0}
    PollReadyError(BoxError),
    /// Buffer error: {0}
    BufferError(BoxError),
    /// Invalid URI: {0}
    InvalidUri(#[from] http::uri::InvalidUri),
    /// Invalid header: {0}
    InvalidHeader(#[from] http::header::InvalidHeaderValue),
    /// Failed to complete mapping task: {0}
    MappingTaskError(tokio::task::JoinError),
    /// Converter not present for {0:?} -> {1:?}
    InvalidConverter(ApiEndpoint, ApiEndpoint),
    /// Stream error: {0}
    StreamError(Box<reqwest_eventsource::Error>),
    /// Upstream 5xx error: {0}
    Provider5xxError(StatusCode),
    /// Metrics not configured for: {0:?}
    MetricsNotConfigured(ApiEndpoint),
}

impl IntoResponse for InternalError {
    fn into_response(self) -> Response {
        error!(error = %self, "internal error");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "Internal Server Error".to_string(),
            }),
        )
            .into_response()
    }
}
