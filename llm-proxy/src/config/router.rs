use std::{collections::HashMap, time::Duration};

use derive_more::AsRef;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

use super::{
    rate_limit::RateLimitConfig,
    retry::{RetryConfig, Strategy},
    spend_control::SpendControlConfig,
};
use crate::{
    discover::Key,
    types::{
        model::{Model, Version},
        provider::Provider,
        router::RouterId,
    },
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

#[derive(Debug, Default, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct RouterConfig {
    pub default_provider: Provider,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cache: Option<CacheControlConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fallback: Option<FallbackConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub balance: Option<BalanceConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retries: Option<RetryConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rate_limit: Option<RateLimitConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub spend_control: Option<SpendControlConfig>,
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
    Weighted { targets: Vec<BalanceTarget> },
    P2C { targets: Vec<BalanceTarget> },
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

pub fn test_router_config() -> RouterConfig {
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

    let balance = BalanceConfig::Weighted {
        targets: vec![BalanceTarget {
            key: Key {
                provider: Provider::OpenAI,
            },
            weight: Decimal::from(1),
        }],
    };
    let retries = RetryConfig {
        enabled: false,
        max_retries: 3,
        strategy: Strategy::Exponential {
            base: Duration::from_secs(1),
            max: Duration::from_secs(10),
        },
    };

    // Create test values for RateLimitConfig
    let default_provider = Provider::OpenAI;
    RouterConfig {
        default_provider,
        cache: Some(cache),
        fallback: Some(fallback),
        balance: Some(balance),
        retries: Some(retries),
        rate_limit: None,
        spend_control: None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

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
