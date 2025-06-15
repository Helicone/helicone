use serde::{Deserialize, Serialize};

use crate::utils::default_true;

/// Response headers useful for additional observability.
#[derive(Default, Debug, Clone, Copy, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub struct ResponseHeadersConfig {
    #[serde(default = "default_true")]
    pub provider: bool,
    #[serde(default = "default_true")]
    pub provider_request_id: bool,
}
