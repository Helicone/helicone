use serde::{Deserialize, Serialize};

/// Response headers useful for additional observability.
#[derive(Default, Debug, Clone, Copy, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub struct ResponseHeadersConfig {
    #[serde(default)]
    pub provider: bool,
    #[serde(default)]
    pub provider_request_id: bool,
}
