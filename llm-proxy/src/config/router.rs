use indexmap::IndexMap;
use rust_decimal::Decimal;
use serde::Deserialize;

use super::{rate_limit::RateLimitConfig, retry::RetryConfig};

#[derive(Debug, Deserialize)]
pub struct RouterConfig {
    pub cache: CacheControlConfig,
    pub fallback: FallbackConfig,
    pub balance: LoadBalanceConfig,
    pub retries: RetryConfig,
    pub rate_limit: RateLimitConfig,
}

#[derive(Debug, Deserialize)]
pub struct CacheControlConfig {
    pub max_age: u64,
    pub max_stale: u64,
    pub buckets: u16,
    pub seed: String,
}

#[derive(Debug, Deserialize)]
pub struct FallbackConfig {
    pub enabled: bool,
    pub order: Vec<ModelVersion>,
}

#[derive(Debug, Deserialize, Eq, PartialEq)]
pub struct LoadBalanceConfig(pub IndexMap<Version, Weight>);

#[derive(Debug, Deserialize, Eq, Hash, PartialEq)]
pub enum Version {
    Prompt(PromptVersion),
    Model(ModelVersion),
}

#[derive(Debug, Deserialize, Eq, Hash, PartialEq)]
pub struct PromptVersion(pub String);

#[derive(Debug, Deserialize, Eq, Hash, PartialEq)]
pub struct ModelVersion(pub String);

#[derive(Debug, Deserialize, Eq, Hash, PartialEq)]
pub struct Weight(pub Decimal);

pub async fn test_router_config() -> RouterConfig {
    let cache = CacheControlConfig {
        max_age: 3600,
        max_stale: 1800,
        buckets: 10,
        seed: "test-seed".to_string(),
    };

    // Create test values for FallbackConfig
    let fallback = FallbackConfig {
        enabled: true,
        order: vec![ModelVersion("claude-3-7-sonnet-latest".to_string())],
    };

    let balance = LoadBalanceConfig(IndexMap::new());
    let retries = RetryConfig {
        enabled: false,
        max_retries: 3,
    };

    // Create test values for RateLimitConfig
    let rate_limit = RateLimitConfig {
        unauthenticated: super::rate_limit::LimitConfig {
            period: std::time::Duration::from_secs(60),
            quota_size: 10,
            enabled: false,
        },
        authenticated: super::rate_limit::LimitConfig {
            period: std::time::Duration::from_secs(60),
            quota_size: 50,
            enabled: false,
        },
    };

    RouterConfig {
        cache,
        fallback,
        balance,
        retries,
        rate_limit,
    }
}
