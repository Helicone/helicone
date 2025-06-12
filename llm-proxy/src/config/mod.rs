pub mod balance;
pub mod discover;
pub mod dispatcher;
pub mod helicone;
pub mod minio;
pub mod model_mapping;
pub mod monitor;
pub mod providers;
pub mod rate_limit;
pub mod redis;
pub mod response_headers;
pub mod retry;
pub mod router;
pub mod server;
pub mod spend_control;
pub mod validation;
use std::path::PathBuf;

use config::ConfigError;
use displaydoc::Display;
use json_patch::merge;
use serde::{Deserialize, Serialize};
use strum::IntoStaticStr;
use thiserror::Error;

use crate::{error::init::InitError, utils::default_true};

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
    Debug, Default, Clone, PartialEq, Eq, Deserialize, Serialize, IntoStaticStr,
)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub enum DeploymentTarget {
    Cloud,
    Sidecar,
    #[default]
    SelfHosted,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub struct AuthConfig {
    /// Whether a Helicone API key is required in order to proxy requests.
    ///
    /// If `require_auth=true`, then we will check for a valid Helicone API key
    /// in the `authorization` header.
    ///
    /// If `require_auth=false`, we will still proxy the request, but certain
    /// Helicone features will not be available, such as governance
    /// features and LLM observability. Costs incurred from the requests
    /// will be charged to the API keys associated with the given router
    /// called by the request, so be warned!
    #[serde(default = "default_true")]
    pub require_auth: bool,
}

impl Default for AuthConfig {
    fn default() -> Self {
        Self {
            require_auth: default_true(),
        }
    }
}

#[derive(Debug, Default, Deserialize, Serialize)]
#[serde(default, deny_unknown_fields, rename_all = "kebab-case")]
pub struct Config {
    pub telemetry: telemetry::Config,
    pub server: self::server::ServerConfig,
    pub minio: self::minio::Config,
    pub dispatcher: self::dispatcher::DispatcherConfig,
    pub auth: AuthConfig,
    /// *ALL* supported providers, independent of router configuration.
    pub providers: self::providers::ProvidersConfig,
    pub discover: self::discover::DiscoverConfig,
    pub rate_limit: self::rate_limit::TopLevelRateLimitConfig,
    /// If a request is made with a model that is not in the `RouterConfig`
    /// model mapping, then we fallback to this.
    pub default_model_mapping: self::model_mapping::ModelMappingConfig,
    pub routers: self::router::RouterConfigs,
    pub deployment_target: DeploymentTarget,
    pub is_production: bool,
    pub response_headers: self::response_headers::ResponseHeadersConfig,
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

    pub fn validate(&self) -> Result<(), InitError> {
        for router_config in self.routers.as_ref().values() {
            router_config.validate()?;
        }
        self.validate_model_mappings()?;
        Ok(())
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
            minio: self::minio::Config::test_default(),
            dispatcher: self::dispatcher::DispatcherConfig::test_default(),
            auth: AuthConfig::default(),
            default_model_mapping:
                self::model_mapping::ModelMappingConfig::default(),
            is_production: false,
            providers: self::providers::ProvidersConfig::default(),
            helicone: self::helicone::HeliconeConfig::test_default(),
            deployment_target: DeploymentTarget::SelfHosted,
            discover: self::discover::DiscoverConfig::test_default(),
            routers: self::router::RouterConfigs::test_default(),
            response_headers:
                self::response_headers::ResponseHeadersConfig::default(),
            rate_limit: self::rate_limit::TopLevelRateLimitConfig::test_default(
            ),
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
