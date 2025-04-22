use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub struct RetryConfig {
    pub enabled: bool,
    pub max_retries: u8,
}
