use displaydoc::Display;
use thiserror::Error;
use tower::BoxError;

/// Logger errors
#[derive(Debug, Error, Display, strum::AsRefStr)]
pub enum LoggerError {
    /// Invalid header: {0}
    InvalidHeaderStr(#[from] http::header::ToStrError),
    /// Invalid log message
    InvalidLogMessage,
    /// Failed to send request: {0}
    FailedToSendRequest(reqwest::Error),
    /// Response error: {0}
    ResponseError(reqwest::Error),
    /// Failed to build log message: {0}
    LogMessageBuilder(BoxError),
    /// Invalid url: {0}
    InvalidUrl(#[from] url::ParseError),
}
