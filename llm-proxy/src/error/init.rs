use displaydoc::Display;
use telemetry::TelemetryError;
use thiserror::Error;

use crate::{config::DeploymentTarget, types::provider::InferenceProvider};

/// Errors that can occur during initialization.
#[derive(Debug, Error, Display)]
pub enum InitError {
    /// Default router not found
    DefaultRouterNotFound,
    /// Deployment target not supported: {0:?}
    DeploymentTargetNotSupported(DeploymentTarget),
    /// Failed to read config: {0}
    Config(#[from] crate::config::Error),
    /// Failed to read TLS certificate: {0}
    Tls(std::io::Error),
    /// Failed to connect to database: {0}
    DatabaseConnection(sqlx::Error),
    /// Migrations failed: {0}
    Migrations(#[from] sqlx::migrate::MigrateError),
    /// Failed to bind to address: {0}
    Bind(std::io::Error),
    /// Telemetry: {0}
    Telemetry(#[from] TelemetryError),
    /// Invalid bucket config: {0}
    InvalidBucketConfig(#[from] rusty_s3::BucketError),
    /// OAuth config: {0}
    OAuthConfig(url::ParseError),
    /// Failed to create reqwest client: {0}
    CreateReqwestClient(reqwest::Error),
    /// Failed to create balancer: {0}
    CreateBalancer(tower::BoxError),
    /// Provider error: {0}
    ProviderError(#[from] crate::error::provider::ProviderError),
    /// Invalid model mapping config: {0}
    InvalidModelMappingConfig(crate::middleware::mapper::error::MapperError),
    /// Invalid weight for provider: {0}
    InvalidWeight(InferenceProvider),
    /// Invalid weighted balancer: {0}
    InvalidWeightedBalancer(String),
    /// Converter registry endpoints not configured for provider: {0}
    EndpointsNotConfigured(InferenceProvider),
}
