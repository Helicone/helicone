pub mod app;
pub mod database;
pub mod dispatcher;
pub mod metrics;
pub mod minio;
pub mod rate_limit;
pub mod retry;
pub mod router;
pub mod server;

use std::path::PathBuf;

use config::ConfigError;
use displaydoc::Display;
use json_patch::merge;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error, Display)]
pub enum Error {
    /// error collecting config sources: {0}
    Source(#[from] ConfigError),
    /// deserialization error for input config: {0}
    InputConfigDeserialization(#[from] serde_path_to_error::Error<ConfigError>),
    /// deserialization error for merged config: {0}
    MergedConfigDeserialization(
        #[from] serde_path_to_error::Error<serde_json::Error>,
    ),
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub struct Config {
    #[serde(default)]
    pub telemetry: telemetry::Config,
    #[serde(default)]
    pub server: self::server::ServerConfig,
    #[serde(default)]
    pub metrics_server: self::metrics::Config,
    #[serde(default)]
    pub database: self::database::Config,
    #[serde(default)]
    pub minio: self::minio::Config,
    #[serde(default)]
    pub rate_limit: self::rate_limit::RateLimitConfig,
    #[serde(default)]
    pub is_production: bool,
}

impl Config {
    pub fn try_read(
        config_file_path: Option<PathBuf>,
    ) -> Result<Self, Box<Error>> {
        let mut default_config = serde_json::to_value(Self::default())
            .expect("default config is serializable");
        let mut builder = config::Config::builder();
        if let Some(path) = config_file_path {
            builder = builder.add_source(config::File::from(path));
        }
        builder = builder.add_source(
            config::Environment::with_prefix("ROCKSTAR")
                .try_parsing(true)
                .separator("__")
                .convert_case(config::Case::Kebab),
        );
        let input_config: serde_json::Value = builder
            .build()
            .map_err(Error::from)
            .map_err(Box::new)?
            .try_deserialize()
            .map_err(Error::from)
            .map_err(Box::new)?;
        merge(&mut default_config, &input_config);
        let config = serde_path_to_error::deserialize(default_config)
            .map_err(Error::from)
            .map_err(Box::new)?;
        Ok(config)
    }

    pub fn telemetry() -> telemetry::Config {
        config::Config::builder()
            .add_source(
                config::Environment::with_prefix("ROCKSTAR__TELEMETRY")
                    .separator("__"),
            )
            .build()
            .and_then(|config| config.try_deserialize())
            .unwrap_or_default()
    }
}

impl Default for Config {
    fn default() -> Self {
        Config {
            telemetry: telemetry::Config::default(),
            server: server::ServerConfig::default(),
            metrics_server: metrics::Config::default(),
            database: database::Config::default(),
            minio: minio::Config::default(),
            rate_limit: rate_limit::RateLimitConfig::default(),
            is_production: false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_is_serializable() {
        // if it doesn't panic, it's good
        let _config = serde_json::to_string(&Config::default())
            .expect("default config is serializable");
    }
}
