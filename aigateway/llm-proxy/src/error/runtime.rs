use displaydoc::Display;
use telemetry::TelemetryError;
use thiserror::Error;

use super::internal::InternalError;
use crate::error::init::InitError;

#[derive(Debug, Error, Display)]
pub enum RuntimeError {
    /// Init: {0}
    Init(#[from] InitError),
    /// Internal error: {0}
    Internal(#[from] InternalError),
    /// Failed to serve: {0}
    Serve(std::io::Error),
    /// Join tokio task: {0}
    Join(#[from] tokio::task::JoinError),
    /// Telemetry: {0}
    Telemetry(#[from] TelemetryError),
    /// Failed to send on channel
    ChannelSendFailed,
    /// Failed to send on websocket due to mutex poison
    WebsocketMutexLock,
}
