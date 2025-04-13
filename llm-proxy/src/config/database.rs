use std::time::Duration;

use serde::{Deserialize, Serialize};

use crate::types::secret::Secret;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(default, deny_unknown_fields, rename_all = "kebab-case")]
pub struct Config {
    pub url: Secret<String>,
    #[serde(with = "humantime_serde", default = "default_connect_timeout")]
    pub connect_timeout: Duration,
}

impl From<Config> for deadpool_postgres::Config {
    fn from(config: Config) -> Self {
        let mut deadpool_config = deadpool_postgres::Config::new();

        deadpool_config.url = Some(config.url.0);
        deadpool_config.connect_timeout = Some(config.connect_timeout);

        deadpool_config
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
            connect_timeout: default_connect_timeout(),
        }
    }
}

fn default_connect_timeout() -> Duration {
    Duration::from_secs(3)
}
