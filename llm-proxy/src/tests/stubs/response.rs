use std::time::Duration;

use indexmap::IndexMap;
use serde_json::Value;
use tokio::runtime::Handle;
use wiremock::ResponseTemplate;

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "kebab-case")]
pub struct ResponseStub {
    /// HTTP response status, defaults to 200
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<u16>,
    /// delay to apply to the response
    #[serde(with = "humantime_serde", skip_serializing_if = "Option::is_none")]
    pub delay: Option<Duration>,
    /// HTTP response body
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<ResponseBodyStub>,
    /// HTTP response headers
    #[serde(default, skip_serializing_if = "IndexMap::is_empty")]
    pub headers: IndexMap<String, String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, Eq, PartialEq)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum ResponseBodyStub {
    /// plain text body
    PlainText(String),
    /// json body
    Json(Value),
    /// binary Base 64 encoded body
    Base64(String),
}

impl ResponseStub {
    pub fn into_response_template(self) -> ResponseTemplate {
        let response = ResponseTemplate::new(self.status.unwrap_or(200))
            .append_headers(self.headers);
        if let Some(delay) = self.delay {
            // This line will panic if called from a non-tokio runtime
            Handle::current().block_on(tokio::time::sleep(delay));
        }

        match self.body {
            Some(ResponseBodyStub::PlainText(text)) => {
                response.set_body_string(text)
            }
            Some(ResponseBodyStub::Json(json)) => response.set_body_json(json),
            Some(ResponseBodyStub::Base64(base64)) => {
                response.set_body_bytes(base64)
            }
            None => response,
        }
    }
}
