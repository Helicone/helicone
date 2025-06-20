pub mod balance;
pub mod cache;
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
pub mod validation;
use std::path::PathBuf;

use config::ConfigError;
use displaydoc::Display;
use json_patch::merge;
use regex::Regex;
use serde::{Deserialize, Serialize};
use strum::IntoStaticStr;
use thiserror::Error;

use crate::{error::init::InitError, types::provider::InferenceProvider};

const ROUTER_ID_REGEX: &str = r"^[A-Za-z0-9_-]{1,12}$";
pub(crate) const SDK: InferenceProvider = InferenceProvider::OpenAI;

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
    SelfHosted,
    #[default]
    Sidecar,
}

#[derive(Debug, Default, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub struct MiddlewareConfig {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cache: Option<self::cache::CacheConfig>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rate_limit: Option<self::rate_limit::GlobalRateLimitConfig>,
}

#[derive(Debug, Default, Deserialize, Serialize)]
#[serde(default, deny_unknown_fields, rename_all = "kebab-case")]
pub struct Config {
    pub telemetry: telemetry::Config,
    pub server: self::server::ServerConfig,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub minio: Option<self::minio::Config>,
    pub dispatcher: self::dispatcher::DispatcherConfig,
    pub discover: self::discover::DiscoverConfig,
    pub response_headers: self::response_headers::ResponseHeadersConfig,
    pub deployment_target: DeploymentTarget,
    pub is_production: bool,

    /// If a request is made with a model that is not in the `RouterConfig`
    /// model mapping, then we fallback to this.
    pub default_model_mapping: self::model_mapping::ModelMappingConfig,
    pub helicone_observability: self::helicone::HeliconeConfig,
    /// *ALL* supported providers, independent of router configuration.
    pub providers: self::providers::ProvidersConfig,

    /// Global middleware configuration, e.g. rate limiting, caching, etc.
    pub global: MiddlewareConfig,
    pub routers: self::router::RouterConfigs,
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
            config::Environment::with_prefix("AI_GATEWAY")
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
        let router_id_regex =
            Regex::new(ROUTER_ID_REGEX).expect("always valid if tests pass");
        for (router_id, router_config) in self.routers.as_ref() {
            router_config.validate()?;
            if !router_id_regex.is_match(router_id.as_ref()) {
                return Err(InitError::InvalidRouterId(router_id.to_string()));
            }
        }
        self.validate_model_mappings()?;
        if matches!(self.deployment_target, DeploymentTarget::SelfHosted)
            && self.minio.is_none()
        {
            return Err(InitError::MinioNotConfigured);
        }
        Ok(())
    }
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for Config {
    fn test_default() -> Self {
        let telemetry = telemetry::Config {
            exporter: telemetry::Exporter::Stdout,
            level: "info,ai_gateway=trace".to_string(),
            ..Default::default()
        };
        let middleware = MiddlewareConfig {
            cache: Some(self::cache::CacheConfig::test_default()),
            rate_limit: Some(
                self::rate_limit::GlobalRateLimitConfig::test_default(),
            ),
        };
        Config {
            telemetry,
            server: self::server::ServerConfig::test_default(),
            minio: Some(self::minio::Config::test_default()),
            dispatcher: self::dispatcher::DispatcherConfig::test_default(),
            default_model_mapping:
                self::model_mapping::ModelMappingConfig::default(),
            global: middleware,
            is_production: false,
            providers: self::providers::ProvidersConfig::default(),
            helicone_observability:
                self::helicone::HeliconeConfig::test_default(),
            deployment_target: DeploymentTarget::Sidecar,
            discover: self::discover::DiscoverConfig::test_default(),
            routers: self::router::RouterConfigs::test_default(),
            response_headers:
                self::response_headers::ResponseHeadersConfig::default(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn router_id_regex_is_valid() {
        assert!(Regex::new(ROUTER_ID_REGEX).is_ok());
    }

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

    #[test]
    fn router_id_regex_positive_cases() {
        let regex = Regex::new(ROUTER_ID_REGEX).unwrap();
        let valid_ids = [
            "a",
            "Z",
            "abc",
            "ABC",
            "A1B2",
            "A-1",
            "a_b",
            "abc_def",
            "0123456789",
            "123456789012", // 12 chars
            "a-b-c-d",
        ];
        for id in valid_ids {
            assert!(
                regex.is_match(id),
                "expected '{id}' to be valid according to ROUTER_ID_REGEX"
            );
        }
    }

    #[test]
    fn router_id_regex_negative_cases() {
        let regex = Regex::new(ROUTER_ID_REGEX).unwrap();
        let invalid_ids = [
            "",
            "with space",
            "special$",
            "1234567890123", // 13 chars
            "trailingdash-",
            "mixed*chars",
        ];
        for id in invalid_ids {
            assert!(
                !regex.is_match(id),
                "expected '{id}' to be invalid according to ROUTER_ID_REGEX"
            );
        }
    }
}
