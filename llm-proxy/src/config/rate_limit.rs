use std::time::Duration;

use serde::{Deserialize, Serialize};
use tower_governor::{
    governor::{GovernorConfig, GovernorConfigBuilder},
    key_extractor::SmartIpKeyExtractor,
};

use crate::middleware::rate_limit::extractor::UserIdExtractor;

pub type UnauthedLimiterConfig = GovernorConfig<
    SmartIpKeyExtractor,
    governor::middleware::StateInformationMiddleware,
>;
pub type AuthedLimiterConfig = GovernorConfig<
    UserIdExtractor,
    governor::middleware::StateInformationMiddleware,
>;

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub struct RateLimitConfig {
    #[serde(default)]
    pub unauthenticated: LimitConfig,
    #[serde(default)]
    pub authenticated: LimitConfig,
    #[serde(with = "humantime_serde", default = "default_cleanup_interval")]
    pub cleanup_interval: Duration,
}

impl Default for RateLimitConfig {
    fn default() -> Self {
        Self {
            unauthenticated: LimitConfig {
                replenish_interval: 6,
                quota: 15,
            },
            authenticated: LimitConfig {
                replenish_interval: 1,
                quota: 20,
            },
            cleanup_interval: Duration::from_secs(60),
        }
    }
}

impl RateLimitConfig {
    pub fn unauthed_limiter(&self) -> UnauthedLimiterConfig {
        GovernorConfigBuilder::default()
            .per_second(self.unauthenticated.replenish_interval.into())
            .burst_size(self.unauthenticated.quota)
            .use_headers()
            .key_extractor(SmartIpKeyExtractor)
            .finish()
            .unwrap()
    }

    pub fn authed_limiter(&self) -> AuthedLimiterConfig {
        GovernorConfigBuilder::default()
            .per_second(self.authenticated.replenish_interval.into())
            .burst_size(self.authenticated.quota)
            .use_headers()
            .key_extractor(UserIdExtractor)
            .finish()
            .unwrap()
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub struct LimitConfig {
    #[serde(default = "default_replenish_interval")]
    pub replenish_interval: u32,
    #[serde(default = "default_quota")]
    pub quota: u32,
}

impl Default for LimitConfig {
    fn default() -> Self {
        Self {
            replenish_interval: default_replenish_interval(),
            quota: default_quota(),
        }
    }
}

fn default_replenish_interval() -> u32 {
    20
}

fn default_quota() -> u32 {
    35
}

fn default_cleanup_interval() -> Duration {
    Duration::from_secs(60)
}
