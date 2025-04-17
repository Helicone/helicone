use std::time::Duration;

use serde::{Deserialize, Serialize};

use crate::types::secret::Secret;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(default, deny_unknown_fields, rename_all = "kebab-case")]
pub struct Config {
    pub url: Secret<String>,
    #[serde(with = "humantime_serde", default = "default_connection_timeout")]
    pub connection_timeout: Duration,
    #[serde(with = "humantime_serde", default = "default_idle_timeout")]
    pub idle_timeout: Duration,
    #[serde(default = "default_max_connections")]
    pub max_connections: u32,
}

impl From<Config> for sqlx::postgres::PgPoolOptions {
    fn from(config: Config) -> Self {
        sqlx::postgres::PgPoolOptions::new()
            .acquire_timeout(config.connection_timeout)
            .idle_timeout(config.idle_timeout)
            .max_connections(config.max_connections)
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            url: Secret(
                "postgresql://helicone-db-user:helicone-db-pw@localhost:5432/\
                 helicone-db"
                    .to_string(),
            ),
            connection_timeout: default_connection_timeout(),
            idle_timeout: default_idle_timeout(),
            max_connections: default_max_connections(),
        }
    }
}

fn default_max_connections() -> u32 {
    20
}

fn default_connection_timeout() -> Duration {
    Duration::from_secs(3)
}

fn default_idle_timeout() -> Duration {
    Duration::from_secs(60)
}
