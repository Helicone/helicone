use std::{num::NonZeroU32, time::Duration};

use serde::{Deserialize, Serialize};
use tower_governor::governor::{GovernorConfig, GovernorConfigBuilder};

use crate::middleware::rate_limit::extractor::RateLimitKeyExtractor;

pub type RateLimiterConfig = GovernorConfig<
    RateLimitKeyExtractor,
    governor::middleware::StateInformationMiddleware,
>;

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub enum TopLevelRateLimitConfig {
    /// Globally enabled rate limits across the entire app.
    ///
    /// Individual routers may still configure their own rate limit
    /// configuration.
    Global {
        #[serde(default)]
        store: RateLimitStore,
        #[serde(default, flatten)]
        limits: LimitsConfig,
        #[serde(
            with = "humantime_serde",
            default = "default_cleanup_interval"
        )]
        cleanup_interval: Duration,
    },
    /// A global setting that routers can selectively opt in to
    /// if they wish to enable rate limiting without needing to repeat
    /// the same settings for each router.
    OptIn {
        #[serde(default)]
        store: RateLimitStore,
        #[serde(default, flatten)]
        limits: LimitsConfig,
        #[serde(
            with = "humantime_serde",
            default = "default_cleanup_interval"
        )]
        cleanup_interval: Duration,
    },
    /// Routers must configure their own rate limit settings.
    RouterSpecific {
        #[serde(default)]
        store: RateLimitStore,
        #[serde(
            with = "humantime_serde",
            default = "default_cleanup_interval"
        )]
        cleanup_interval: Duration,
    },
}

impl TopLevelRateLimitConfig {
    #[must_use]
    pub fn default_enabled_config() -> Self {
        Self::Global {
            store: RateLimitStore::default(),
            limits: LimitsConfig::default(),
            cleanup_interval: default_cleanup_interval(),
        }
    }

    #[must_use]
    pub fn global_limiter(&self) -> Option<RateLimiterConfig> {
        match self {
            TopLevelRateLimitConfig::Global { limits, .. } => {
                let gcra = &limits.per_api_key;
                let per_cell_duration = gcra
                    .refill_frequency
                    .checked_div(gcra.capacity.into())
                    .unwrap_or_else(|| {
                        tracing::warn!(
                            "fill_frequency is too small for capacity, using \
                             default fill frequency"
                        );
                        default_refill_frequency()
                    });

                GovernorConfigBuilder::default()
                    .period(per_cell_duration)
                    .burst_size(gcra.capacity.get())
                    .use_headers()
                    .key_extractor(RateLimitKeyExtractor)
                    .finish()
            }
            _ => None,
        }
    }

    #[must_use]
    pub fn cleanup_interval(&self) -> Duration {
        match self {
            TopLevelRateLimitConfig::Global {
                cleanup_interval, ..
            }
            | TopLevelRateLimitConfig::OptIn {
                cleanup_interval, ..
            }
            | TopLevelRateLimitConfig::RouterSpecific {
                cleanup_interval,
                ..
            } => *cleanup_interval,
        }
    }
}

impl Default for TopLevelRateLimitConfig {
    fn default() -> Self {
        Self::RouterSpecific {
            store: RateLimitStore::InMemory,
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
        Self::RouterSpecific {
            store: RateLimitStore::InMemory,
            cleanup_interval: Duration::from_secs(60),
        }
    }
}

#[cfg(feature = "testing")]
#[must_use]
pub fn enabled_for_test_in_memory() -> TopLevelRateLimitConfig {
    use crate::tests::TestDefault;
    TopLevelRateLimitConfig::Global {
        store: RateLimitStore::InMemory,
        limits: LimitsConfig::test_default(),
        cleanup_interval: Duration::from_secs(60),
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
#[derive(Default)]
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
