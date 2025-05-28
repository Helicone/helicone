use std::time::Duration;

use serde::{Deserialize, Serialize};

use crate::types::secret::Secret;

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub struct RedisConfig {
    #[serde(default = "default_url")]
    pub url: Secret<String>,
    #[serde(with = "humantime_serde", default = "default_connection_timeout")]
    pub connection_timeout: Duration,
}

impl Default for RedisConfig {
    fn default() -> Self {
        Self {
            url: default_url(),
            connection_timeout: default_connection_timeout(),
        }
    }
}

fn default_url() -> Secret<String> {
    Secret("redis://localhost:6379".to_string())
}

fn default_connection_timeout() -> Duration {
    Duration::from_secs(1)
}
