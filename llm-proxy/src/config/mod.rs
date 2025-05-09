pub mod database;
pub mod discover;
pub mod dispatcher;
pub mod helicone;
pub mod minio;
pub mod model_mapping;
pub mod providers;
pub mod rate_limit;
pub mod retry;
pub mod router;
pub mod server;
pub mod spend_control;
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

#[derive(
    Debug, Default, Clone, Copy, PartialEq, Eq, Deserialize, Serialize,
)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub enum DeploymentTarget {
    Cloud,
    Sidecar,
    #[default]
    SelfHosted,
}

#[derive(Debug, Default, Deserialize, Serialize)]
#[serde(default, deny_unknown_fields, rename_all = "kebab-case")]
pub struct Config {
    pub telemetry: telemetry::Config,
    pub server: self::server::ServerConfig,
    pub database: self::database::Config,
    pub minio: self::minio::Config,
    pub dispatcher: self::dispatcher::DispatcherConfig,
    /// *ALL* supported providers, independent of router configuration.
    pub providers: self::providers::ProvidersConfig,
    pub discover: self::discover::DiscoverConfig,
    /// If a request is made with a model that is not in the `RouterConfig`
    /// model mapping, then we fallback to this.
    pub default_model_mapping: self::model_mapping::ModelMappingConfig,
    pub routers: self::router::RouterConfigs,
    // TODO: only have this field for CloudHosted mode, (maybe a struct enum
    // for deployment_target?), so cloud hosted mode can support a global
    // rate limit. self hosted and sidecar will simply have rate limits on
    // router level
    pub rate_limit: self::rate_limit::RateLimitConfig,
    pub deployment_target: DeploymentTarget,
    pub is_production: bool,
    pub helicone: self::helicone::HeliconeConfig,
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
            config::Environment::with_prefix("PROXY")
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

    #[must_use]
    pub fn telemetry() -> telemetry::Config {
        config::Config::builder()
            .add_source(
                config::Environment::with_prefix("PROXY__TELEMETRY")
                    .separator("__"),
            )
            .build()
            .and_then(config::Config::try_deserialize)
            .unwrap_or_default()
    }
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for Config {
    fn test_default() -> Self {
        let telemetry = telemetry::Config {
            exporter: telemetry::Exporter::Stdout,
            level: "info,llm_proxy=trace".to_string(),
            ..Default::default()
        };
        Config {
            telemetry,
            server: self::server::ServerConfig::test_default(),
            database: self::database::Config::default(),
            minio: self::minio::Config::test_default(),
            dispatcher: self::dispatcher::DispatcherConfig::test_default(),
            default_model_mapping:
                self::model_mapping::ModelMappingConfig::default(),
            is_production: false,
            providers: self::providers::ProvidersConfig::default(),
            helicone: self::helicone::HeliconeConfig::test_default(),
            deployment_target: DeploymentTarget::SelfHosted,
            rate_limit: self::rate_limit::RateLimitConfig::test_default(),
            discover: self::discover::DiscoverConfig::test_default(),
            routers: self::router::RouterConfigs::test_default(),
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

    #[test]
    fn deployment_target_round_trip() {
        let config = DeploymentTarget::Sidecar;
        let serialized = serde_json::to_string(&config).unwrap();
        let deserialized =
            serde_json::from_str::<DeploymentTarget>(&serialized).unwrap();
        assert_eq!(config, deserialized);
    }
}
