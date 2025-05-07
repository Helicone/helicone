use chrono::{DateTime, Utc};
use http::HeaderMap;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize, Serializer};
use typed_builder::TypedBuilder;
use url::Url;
use uuid::Uuid;

use super::{provider::Provider, user::UserId};
use crate::error::logger::LoggerError;

#[derive(Debug, Serialize, Deserialize)]
pub struct S3Log {
    pub request: String,
    pub response: String,
}

impl S3Log {
    #[must_use]
    pub fn new(request: String, response: String) -> Self {
        Self { request, response }
    }
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct HeliconeLogMetadata {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_override: Option<String>,
    pub omit_request_log: bool,
    pub omit_response_log: bool,
    pub webhook_enabled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub posthog_api_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub posthog_host: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lytix_key: Option<String>,
}

impl HeliconeLogMetadata {
    pub fn from_headers(headers: &mut HeaderMap) -> Result<Self, LoggerError> {
        let model_override = headers
            .remove("x-helicone-model-override")
            .map(|v| v.to_str().map(std::borrow::ToOwned::to_owned))
            .transpose()?;
        let omit_request_log =
            headers.get("x-helicone-omit-request-log").is_some();
        let omit_response_log =
            headers.get("x-helicone-omit-response-log").is_some();
        let webhook_enabled =
            headers.remove("x-helicone-webhook-enabled").is_some();
        let posthog_api_key = headers
            .remove("x-helicone-posthog-api-key")
            .map(|v| v.to_str().map(std::borrow::ToOwned::to_owned))
            .transpose()?;
        let posthog_host = headers
            .remove("x-helicone-posthog-host")
            .map(|v| v.to_str().map(std::borrow::ToOwned::to_owned))
            .transpose()?;
        let lytix_key = headers
            .remove("x-helicone-lytix-key")
            .map(|v| v.to_str().map(std::borrow::ToOwned::to_owned))
            .transpose()?;
        Ok(Self {
            model_override,
            omit_request_log,
            omit_response_log,
            webhook_enabled,
            posthog_api_key,
            posthog_host,
            lytix_key,
        })
    }
}

#[derive(Debug, Serialize, Deserialize, TypedBuilder)]
#[serde(rename_all = "camelCase")]
pub struct RequestLog {
    pub id: Uuid,
    pub user_id: UserId,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[builder(default)]
    pub prompt_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[builder(default)]
    pub prompt_version: Option<String>,
    #[builder(default)]
    pub properties: IndexMap<String, String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[builder(default)]
    pub helicone_api_key_id: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[builder(default)]
    pub helicone_proxy_key_id: Option<String>,
    pub target_url: Url,
    #[serde(serialize_with = "serialize_uppercase")]
    pub provider: Provider,
    pub body_size: f64,
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[builder(default)]
    pub threat: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[builder(default)]
    pub country_code: Option<isocountry::CountryCode>,
    pub request_created_at: DateTime<Utc>,
    pub is_stream: bool,
    // TODO: make proper type, this is not really a string
    #[serde(skip_serializing_if = "Option::is_none")]
    #[builder(default)]
    pub helicone_template: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[builder(default)]
    pub experiment_column_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[builder(default)]
    pub experiment_row_index: Option<String>,
}

#[allow(clippy::trivially_copy_pass_by_ref)]
fn serialize_uppercase<S>(
    value: &Provider,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    serializer.serialize_str(&value.to_string().to_uppercase())
}

#[derive(Debug, Serialize, Deserialize, Default, TypedBuilder)]
#[serde(rename_all = "camelCase")]
pub struct ResponseLog {
    pub id: Uuid,
    pub status: f64,
    pub body_size: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[builder(default)]
    pub time_to_first_token: Option<f64>,
    pub response_created_at: DateTime<Utc>,
    pub delay_ms: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Log {
    pub request: RequestLog,
    pub response: ResponseLog,
}

impl Log {
    #[must_use]
    pub fn new(request: RequestLog, response: ResponseLog) -> Self {
        Self { request, response }
    }
}

#[derive(Debug, Serialize, Deserialize, TypedBuilder)]
#[serde(rename_all = "camelCase")]
pub struct LogMessage {
    pub authorization: String,
    pub helicone_meta: HeliconeLogMetadata,
    pub log: Log,
}
