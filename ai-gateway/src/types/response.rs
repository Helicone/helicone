use axum_core::body::Body;
use serde::{Deserialize, Serialize};

pub type Response = http::Response<Body>;

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged, rename_all = "camelCase")]
pub enum JawnResponse<T> {
    Data { data: T },
    Error { error: String },
}

impl<T> JawnResponse<T> {
    pub fn data(self) -> Result<T, String> {
        match self {
            JawnResponse::Data { data } => Ok(data),
            JawnResponse::Error { error } => Err(error),
        }
    }
}
