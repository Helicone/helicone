use std::collections::HashMap;

use derive_more::{AsMut, AsRef};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

use super::{
    balance::{BalanceConfig, BalanceConfigInner},
    model_mapping::ModelMappingConfig,
    rate_limit::RateLimitConfig,
    retry::RetryConfig,
    spend_control::SpendControlConfig,
};
use crate::{
    error::{init::InitError, provider::ProviderError},
    types::{model::Model, provider::InferenceProvider, router::RouterId},
};

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq, AsRef, AsMut)]
pub struct RouterConfigs(HashMap<RouterId, RouterConfig>);

impl RouterConfigs {
    #[must_use]
    pub fn new(configs: HashMap<RouterId, RouterConfig>) -> Self {
        Self(configs)
    }
}

impl Default for RouterConfigs {
    fn default() -> Self {
        Self(HashMap::from([(
            RouterId::Default,
            RouterConfig::default(),
        )]))
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct RouterConfig {
    #[serde(default = "default_request_style")]
    pub request_style: InferenceProvider,
    pub model_mappings: ModelMappingConfig,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cache: Option<CacheControlConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fallback: Option<FallbackConfig>,
    pub balance: BalanceConfig,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retries: Option<RetryConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rate_limit: Option<RateLimitConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub spend_control: Option<SpendControlConfig>,
}

impl Default for RouterConfig {
    fn default() -> Self {
        Self {
            request_style: InferenceProvider::OpenAI,
            model_mappings: ModelMappingConfig::default(),
            cache: None,
            fallback: None,
            balance: BalanceConfig::default(),
            retries: None,
            rate_limit: None,
            spend_control: None,
        }
    }
}

fn default_request_style() -> InferenceProvider {
    InferenceProvider::OpenAI
}

impl RouterConfig {
    pub fn validate(&self) -> Result<(), InitError> {
        let providers = self.balance.providers();
        for balance_config in self.balance.0.values() {
            match balance_config {
                BalanceConfigInner::Weighted { targets } => {
                    let total =
                        targets.iter().map(|t| t.weight).sum::<Decimal>();
                    if total != Decimal::from(1) {
                        return Err(InitError::InvalidWeightedBalancer(
                            format!("Balance weights dont sum to 1: {total}"),
                        ));
                    }
                }
                BalanceConfigInner::P2C { .. } => {}
            }
        }

        // check that all providers in the fallback config are in the providers
        // list
        if let Some(fallback_config) = &self.fallback {
            if let Some(unsupported_provider) = fallback_config
                .order
                .iter()
                .find(|target| !providers.contains(&target.provider))
            {
                return Err(ProviderError::ProviderNotConfigured(
                    unsupported_provider.provider,
                )
                .into());
            }
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct CacheControlConfig {
    /// Cache-control header: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control>
    pub directive: String,
    pub enabled: bool,
    pub buckets: u16,
    pub seed: String,
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct FallbackConfig {
    pub enabled: bool,
    #[serde(default)]
    pub order: Vec<FallbackTarget>,
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct FallbackTarget {
    pub provider: InferenceProvider,
    pub model: Model,
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, Hash, PartialEq)]
pub struct PromptVersion(pub String);

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for RouterConfigs {
    fn test_default() -> Self {
        Self(HashMap::from([(
            RouterId::Default,
            RouterConfig {
                request_style: InferenceProvider::OpenAI,
                model_mappings: ModelMappingConfig::default(),
                cache: None,
                fallback: None,
                balance: BalanceConfig(HashMap::from([(
                    crate::endpoints::EndpointType::Chat,
                    BalanceConfigInner::P2C {
                        targets: nonempty_collections::nes![
                            InferenceProvider::OpenAI
                        ],
                    },
                )])),
                retries: None,
                rate_limit: None,
                spend_control: None,
            },
        )]))
    }
}

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use super::*;
    use crate::{config::retry::Strategy, types::model::Version};

    fn test_router_config() -> RouterConfig {
        let cache = CacheControlConfig {
            directive: "max-age=3600, max-stale=1800".to_string(),
            enabled: true,
            buckets: 10,
            seed: "test-seed".to_string(),
        };

        // Create test values for FallbackConfig
        let fallback = FallbackConfig {
            enabled: true,
            order: vec![FallbackTarget {
                provider: InferenceProvider::OpenAI,
                model: Model {
                    name: "claude-3-7-sonnet-latest".to_string(),
                    version: Some(Version::Latest),
                },
            }],
        };

        let balance = BalanceConfig::p2c_all_providers();
        let retries = RetryConfig {
            enabled: false,
            max_retries: 3,
            strategy: Strategy::Exponential {
                base: Duration::from_secs(1),
                max: Duration::from_secs(10),
            },
        };

        RouterConfig {
            request_style: InferenceProvider::OpenAI,
            model_mappings: ModelMappingConfig::default(),
            cache: Some(cache),
            fallback: Some(fallback),
            balance,
            retries: Some(retries),
            rate_limit: None,
            spend_control: None,
        }
    }

    #[test]
    fn router_config_round_trip() {
        let config = test_router_config();
        let serialized = serde_json::to_string(&config).unwrap();
        let deserialized =
            serde_json::from_str::<RouterConfig>(&serialized).unwrap();
        assert_eq!(config, deserialized);
    }

    #[test]
    fn router_configs_round_trip() {
        let config = RouterConfigs::default();
        let serialized = serde_json::to_string(&config).unwrap();
        let deserialized =
            serde_json::from_str::<RouterConfigs>(&serialized).unwrap();
        assert_eq!(config, deserialized);
    }
}
