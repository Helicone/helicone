use displaydoc::Display;
use thiserror::Error;

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
    /// Invalid url: {0}
    InvalidUrl(#[from] url::ParseError),
    /// Unable to convert body to utf8: {0}
    BodyNotUtf8(#[from] std::string::FromUtf8Error),
    /// No auth context set
    NoAuthContextSet,
}
