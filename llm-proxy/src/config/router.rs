use std::collections::HashMap;

use derive_more::AsRef;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

use super::{
    rate_limit::RateLimitConfig, retry::RetryConfig,
    spend_control::SpendControlConfig,
};
use crate::types::{provider::Provider, router::RouterId};

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
    pub order: Vec<ModelVersion>,
}

/// When it's time to add this, we need a weighted balance
/// impl.
///
/// See e.g.:
/// https://github.com/tower-rs/tower/issues/696
/// https://github.com/tower-rs/tower/pull/695/files
#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
pub struct BalanceConfig(pub Vec<BalanceTarget>);

#[derive(Debug, Clone, Deserialize, Serialize, Eq, Hash, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct BalanceTarget {
    pub model: ModelVersion,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<PromptVersion>,
    pub weight: Decimal,
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, Hash, PartialEq)]
pub struct PromptVersion(pub String);

#[derive(Debug, Clone, Deserialize, Serialize, Eq, Hash, PartialEq)]
pub struct ModelVersion(pub String);

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
        order: vec![ModelVersion("claude-3-7-sonnet-latest".to_string())],
    };

    let balance = BalanceConfig(vec![BalanceTarget {
        model: ModelVersion("claude-3-7-sonnet-latest".to_string()),
        prompt: None,
        weight: Decimal::from(1),
    }]);
    let retries = RetryConfig {
        enabled: false,
        max_retries: 3,
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
}
