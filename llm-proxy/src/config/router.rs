use std::collections::HashMap;

use derive_more::AsRef;
use nonempty_collections::{NEVec, nev};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

use super::{
    rate_limit::RateLimitConfig, retry::RetryConfig,
    spend_control::SpendControlConfig,
};
use crate::{
    discover::Key,
    error::provider::ProviderError,
    types::{model::Model, provider::Provider, router::RouterId},
};

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq, AsRef)]
pub struct RouterConfigs(HashMap<RouterId, RouterConfig>);

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
    /// First provider is the default provider
    pub providers: NEVec<Provider>,
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
            providers: nev![Provider::OpenAI, Provider::Anthropic],
            cache: None,
            fallback: None,
            balance: BalanceConfig::p2c_all_providers(),
            retries: None,
            rate_limit: None,
            spend_control: None,
        }
    }
}

impl RouterConfig {
    pub fn validate(&self) -> Result<(), ProviderError> {
        // TODO: when we add support for weighted balancing, we need to validate
        // it adds up to 100%
        let unsupported_provider = match &self.balance {
            BalanceConfig::Weighted { targets } => targets
                .iter()
                .find(|target| !self.providers.contains(&target.key.provider))
                .map(|target| &target.key.provider),
            BalanceConfig::P2C { targets } => {
                targets.iter().find(|target_provider| {
                    !self.providers.contains(target_provider)
                })
            }
        };
        if let Some(provider) = unsupported_provider {
            return Err(ProviderError::ProviderNotConfigured(*provider));
        }

        // check that all providers in the fallback config are in the providers
        // list
        if let Some(fallback_config) = &self.fallback {
            if let Some(unsupported_provider) = fallback_config
                .order
                .iter()
                .find(|target| !self.providers.contains(&target.provider))
            {
                return Err(ProviderError::ProviderNotConfigured(
                    unsupported_provider.provider,
                ));
            }
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct CacheControlConfig {
    /// Cache-control header: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
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
    pub provider: Provider,
    pub model: Model,
}

/// When it's time to add this, we need a weighted balance
/// impl.
///
/// See e.g.:
/// https://github.com/tower-rs/tower/issues/696
/// https://github.com/tower-rs/tower/pull/695/files
#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case", tag = "strategy")]
pub enum BalanceConfig {
    Weighted { targets: NEVec<BalanceTarget> },
    P2C { targets: NEVec<Provider> },
}

impl BalanceConfig {
    pub fn p2c_all_providers() -> Self {
        Self::P2C {
            targets: nev![Provider::OpenAI, Provider::Anthropic],
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, Hash, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct BalanceTarget {
    #[serde(flatten)]
    pub key: Key,
    pub weight: Decimal,
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, Hash, PartialEq)]
pub struct PromptVersion(pub String);

#[derive(Debug, Clone, Deserialize, Eq, Hash, PartialEq)]
pub struct Weight(pub Decimal);

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for RouterConfigs {
    fn test_default() -> Self {
        Self(HashMap::from([(
            RouterId::Default,
            RouterConfig {
                providers: nev![Provider::OpenAI],
                cache: None,
                fallback: None,
                balance: BalanceConfig::P2C {
                    targets: nev![Provider::OpenAI],
                },
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

    use nonempty_collections::nev;

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
                provider: Provider::OpenAI,
                model: Model {
                    name: "claude-3-7-sonnet".to_string(),
                    version: Some(Version::Latest),
                },
            }],
        };

        let providers = nev![Provider::OpenAI, Provider::Anthropic];
        let balance = BalanceConfig::P2C {
            targets: providers.clone(),
        };
        let retries = RetryConfig {
            enabled: false,
            max_retries: 3,
            strategy: Strategy::Exponential {
                base: Duration::from_secs(1),
                max: Duration::from_secs(10),
            },
        };

        RouterConfig {
            providers,
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
