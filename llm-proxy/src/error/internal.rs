use axum_core::response::{IntoResponse, Response};
use displaydoc::Display;
use http::StatusCode;
use thiserror::Error;
use tower::BoxError;
use tracing::error;

use super::ErrorMetric;
use crate::{
    endpoints::ApiEndpoint,
    error::{api::ErrorResponse, mapper::MapperErrorMetric},
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
    MapperError(#[from] crate::error::mapper::MapperError),
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
    /// Failed to sign AWS request: {0}
    AwsRequestSigningError(String),
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

/// Auth errors for metrics. This is a special type
/// that avoids including dynamic information to limit cardinality
/// such that we can use this type in metrics.
#[derive(Debug, Error, Display, strum::AsRefStr)]
pub enum InternalErrorMetric {
    /// Internal error
    Internal,
    /// Could not serialize
    Serialize,
    /// Could not deserialize
    Deserialize,
    /// Router config provider not present in `ProvidersConfig`
    ProviderNotConfigured,
    /// Extension not found
    ExtensionNotFound,
    /// Provider not found
    ProviderNotFound,
    /// Could not collect response body
    CollectBodyError,
    /// Could not process request body
    RequestBodyError,
    /// Reqwest error
    ReqwestError,
    /// Http error
    HttpError,
    /// Mapper error
    MapperError(#[from] crate::error::mapper::MapperErrorMetric),
    /// Load balancer error
    LoadBalancerError,
    /// Poll ready error
    PollReadyError,
    /// Buffer error
    BufferError,
    /// Invalid URI
    InvalidUri,
    /// Invalid header
    InvalidHeader,
    /// Failed to complete tokio task
    TokioTaskError,
    /// Converter not present
    InvalidConverter,
    /// Stream error
    StreamError,
    /// Upstream 5xx error
    Provider5xxError,
    /// Metrics not configured
    MetricsNotConfigured,
    /// Failed to sign AWS request
    AwsRequestSigningError,
}

impl From<&InternalError> for InternalErrorMetric {
    fn from(error: &InternalError) -> Self {
        match error {
            InternalError::Internal => Self::Internal,
            InternalError::Serialize { .. } => Self::Serialize,
            InternalError::Deserialize { .. } => Self::Deserialize,
            InternalError::ProviderNotConfigured(_) => {
                Self::ProviderNotConfigured
            }
            InternalError::ExtensionNotFound(_) => Self::ExtensionNotFound,
            InternalError::ProviderNotFound => Self::ProviderNotFound,
            InternalError::CollectBodyError(_) => Self::CollectBodyError,
            InternalError::RequestBodyError(_) => Self::RequestBodyError,
            InternalError::ReqwestError(_) => Self::ReqwestError,
            InternalError::HttpError(_) => Self::HttpError,
            InternalError::MapperError(error) => {
                Self::MapperError(MapperErrorMetric::from(error))
            }
            InternalError::LoadBalancerError(_) => Self::LoadBalancerError,
            InternalError::PollReadyError(_) => Self::PollReadyError,
            InternalError::BufferError(_) => Self::BufferError,
            InternalError::InvalidUri(_) => Self::InvalidUri,
            InternalError::InvalidHeader(_) => Self::InvalidHeader,
            InternalError::MappingTaskError(_) => Self::TokioTaskError,
            InternalError::InvalidConverter(_, _) => Self::InvalidConverter,
            InternalError::StreamError(_) => Self::StreamError,
            InternalError::Provider5xxError(_) => Self::Provider5xxError,
            InternalError::MetricsNotConfigured(_) => {
                Self::MetricsNotConfigured
            }
            InternalError::AwsRequestSigningError(_) => {
                Self::AwsRequestSigningError
            }
        }
    }
}

impl ErrorMetric for InternalError {
    fn error_metric(&self) -> String {
        if let InternalError::MapperError(e) = self {
            let e = MapperErrorMetric::from(e);
            format!("InternalError:MapperError:{}", e.as_ref())
        } else {
            InternalErrorMetric::from(self).as_ref().to_string()
        }
    }
}
