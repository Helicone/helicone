pub mod matcher;

use std::time::Duration;

use indexmap::IndexMap;
use serde_json::Value;
use serde_with::{DisplayFromStr, serde_as};

#[derive(serde::Serialize, serde::Deserialize, Debug)]
#[serde(rename_all = "kebab-case")]
pub struct Stub {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uuid: Option<String>,
    /// Precedence of the stub. Lower is higher priority, with 1 being the highest.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub priority: Option<u8>,
    #[serde(rename = "request")]
    pub http_request: Option<RequestStub>,
    #[serde(rename = "response")]
    pub http_response: Option<ResponseStub>,
}

#[serde_as]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "kebab-case")]
pub struct RequestStub {
    #[serde_as(as = "DisplayFromStr")]
    pub method: http::Method,
    pub url: url::Url,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub body_patterns: Vec<RequestBodyMatcherStub>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type",rename_all = "kebab-case")]
pub enum RequestBodyMatcherStub {
    EqualToJson(Value),
    MatchesJsonPath {
        /// the json path to match
        path: String,
        /// the value to match against
        value: Value,
    },
    ContainsJson(Value),
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "kebab-case")]
pub struct ResponseStub {
    /// HTTP response status
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<u16>,
    /// delay to apply to the response
    #[serde(with = "humantime_serde", skip_serializing_if = "Option::is_none")]
    pub delay: Option<Duration>,
    /// HTTP response body
    pub body: ResponseBodyStub,
    /// HTTP response headers
    pub headers: IndexMap<String, String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, Eq, PartialEq)]
#[serde(tag = "type",rename_all = "kebab-case")]
pub enum ResponseBodyStub {
    /// plain text body
    PlainText(String),
    /// json body
    Json(Value),
    /// binary Base 64 encoded body
    Base64(String),
}