use displaydoc::Display;
use thiserror::Error;

/// Test errors
#[derive(Debug, Error, Display, strum::AsRefStr)]
pub enum TestError {
    /// IO error: {0}
    Io(#[from] std::io::Error),
    /// JSON error: {0}
    Json(#[from] serde_json::Error),
}
