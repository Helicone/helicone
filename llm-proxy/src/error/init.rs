use displaydoc::Display;
use telemetry::TelemetryError;
use thiserror::Error;

use crate::config::server::DeploymentTarget;

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
    /// Minio credentials not set
    MissingMinioCredentials,
    /// Minio client: {0}
    MinioClient(#[from] minio_rsc::error::ValueError),
    /// Minio migration: {0}
    MinioMigration(minio_rsc::error::Error),
    /// OAuth config: {0}
    OAuthConfig(url::ParseError),
}
