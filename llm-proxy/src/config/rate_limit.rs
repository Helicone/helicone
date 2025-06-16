use std::{num::NonZeroU32, time::Duration};

use serde::{Deserialize, Serialize};
use tower_governor::governor::{GovernorConfig, GovernorConfigBuilder};

use crate::middleware::rate_limit::extractor::RateLimitKeyExtractor;

pub type RateLimiterConfig = GovernorConfig<
    RateLimitKeyExtractor,
    governor::middleware::StateInformationMiddleware,
>;

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct TopLevelRateLimitConfig {
    #[serde(default)]
    pub store: RateLimitStore,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub global_limits: Option<LimitsConfig>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub unified_api_limits: Option<LimitsConfig>,
    #[serde(with = "humantime_serde", default = "default_cleanup_interval")]
    pub cleanup_interval: Duration,
}

impl TopLevelRateLimitConfig {
    #[must_use]
    pub fn global_limiter(&self) -> Option<RateLimiterConfig> {
        limiter_config(self.global_limits.as_ref())
    }

    #[must_use]
    pub fn unified_api_limiter(&self) -> Option<RateLimiterConfig> {
        limiter_config(self.unified_api_limits.as_ref())
    }

    #[must_use]
    pub fn cleanup_interval(&self) -> Duration {
        self.cleanup_interval
    }
}

fn limiter_config(limits: Option<&LimitsConfig>) -> Option<RateLimiterConfig> {
    if let Some(limits) = limits {
        let gcra = &limits.per_api_key;
        let per_cell_duration = gcra
            .refill_frequency
            .checked_div(gcra.capacity.into())
            .unwrap_or_else(|| {
                tracing::warn!(
                    "fill_frequency is too small for capacity, using default \
                     fill frequency"
                );
                default_refill_frequency()
            });

        GovernorConfigBuilder::default()
            .period(per_cell_duration)
            .burst_size(gcra.capacity.get())
            .use_headers()
            .key_extractor(RateLimitKeyExtractor)
            .finish()
    } else {
        None
    }
}

impl Default for TopLevelRateLimitConfig {
    fn default() -> Self {
        Self {
            store: RateLimitStore::InMemory,
            global_limits: None,
            unified_api_limits: None,
            cleanup_interval: default_cleanup_interval(),
        }
    }
}

#[derive(Debug, Default, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub enum RateLimitStore {
    #[default]
    InMemory,
}

fn default_capacity() -> NonZeroU32 {
    NonZeroU32::new(500).unwrap()
}

pub(crate) fn default_refill_frequency() -> Duration {
    Duration::from_secs(1)
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for TopLevelRateLimitConfig {
    fn test_default() -> Self {
        Self {
            store: RateLimitStore::InMemory,
            global_limits: None,
            unified_api_limits: None,
            cleanup_interval: Duration::from_secs(60),
        }
    }
}

#[cfg(feature = "testing")]
#[must_use]
pub fn enabled_for_test_in_memory() -> TopLevelRateLimitConfig {
    use crate::tests::TestDefault;
    TopLevelRateLimitConfig {
        store: RateLimitStore::InMemory,
        global_limits: Some(LimitsConfig::test_default()),
        unified_api_limits: None,
        cleanup_interval: Duration::from_secs(60),
    }
}

#[derive(Debug, Default, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub struct LimitsConfig {
    pub per_api_key: GcraConfig,
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for LimitsConfig {
    fn test_default() -> Self {
        Self {
            per_api_key: GcraConfig::test_default(),
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub struct GcraConfig {
    /// The duration it takes to refill the entire rate limit quota.
    #[serde(with = "humantime_serde", default = "default_refill_frequency")]
    pub refill_frequency: Duration,
    /// The rate limit quota capacity.
    #[serde(default = "default_capacity")]
    pub capacity: NonZeroU32,
}

impl Default for GcraConfig {
    fn default() -> Self {
        Self {
            refill_frequency: default_refill_frequency(),
            capacity: default_capacity(),
        }
    }
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for GcraConfig {
    fn test_default() -> Self {
        Self {
            refill_frequency: Duration::from_millis(500),
            capacity: NonZeroU32::new(3).unwrap(),
        }
    }
}

fn default_cleanup_interval() -> Duration {
    // 5 minutes
    Duration::from_secs(60 * 5)
}
