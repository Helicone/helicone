use derive_more::Display;
use http::StatusCode;
use rama::http::{IntoResponse, Response};

#[derive(Debug, Display, strum::AsRefStr, thiserror::Error)]
pub enum AuthError {
    /// Invalid credentials
    InvalidCredentials,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        match self {
            Self::InvalidCredentials => {
                (StatusCode::UNAUTHORIZED, "Invalid credentials")
                    .into_response()
            }
        }
    }
}
