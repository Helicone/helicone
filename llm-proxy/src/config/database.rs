use std::time::Duration;

use serde::{Deserialize, Serialize};

use crate::types::secret::Secret;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(default, deny_unknown_fields, rename_all = "kebab-case")]
pub struct Config {
    pub url: Secret<String>,
    #[serde(default = "default_max_connections")]
    pub max_connections: u32,
    #[serde(with = "humantime_serde", default = "default_acquire_timeout")]
    pub acquire_timeout: Duration,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            url: Secret(
                "postgresql://rockstar-db-user:rockstar-db-pw@localhost:5432/\
                 rockstar-db"
                    .to_string(),
            ),
            max_connections: default_max_connections(),
            acquire_timeout: default_acquire_timeout(),
        }
    }
}

fn default_max_connections() -> u32 {
    20
}

fn default_acquire_timeout() -> Duration {
    Duration::from_secs(3)
}
