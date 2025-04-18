use displaydoc::Display;
use rama::error::OpaqueError;
use telemetry::TelemetryError;
use thiserror::Error;

use crate::error::init;

#[derive(Debug, Error, Display)]
pub enum Error {
    /// Init: {0}
    Init(#[from] self::init::InitError),
    /// Failed to serve: {0}
    Serve(std::io::Error),
    /// Join tokio task: {0}
    Join(#[from] tokio::task::JoinError),
    /// Telemetry: {0}
    Telemetry(#[from] TelemetryError),
    /// Shutdown: {0}
    Shutdown(OpaqueError),
}
