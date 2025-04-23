use displaydoc::Display;
use telemetry::TelemetryError;
use thiserror::Error;

use crate::error::init::InitError;

#[derive(Debug, Error, Display)]
pub enum RuntimeError {
    /// Init: {0}
    Init(#[from] InitError),
    /// Failed to serve: {0}
    Serve(std::io::Error),
    /// Join tokio task: {0}
    Join(#[from] tokio::task::JoinError),
    /// Telemetry: {0}
    Telemetry(#[from] TelemetryError),
}
