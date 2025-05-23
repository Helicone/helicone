use std::time::Duration;

use serde::{Deserialize, Serialize};

use super::redis::RedisConfig;

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(deny_unknown_fields, untagged, rename_all = "kebab-case")]
pub enum RateLimitConfig {
    Enabled {
        #[serde(default)]
        store: RateLimitStore,
        #[serde(default, flatten)]
        limits: LimitConfig,
    },
    Disabled,
}

#[derive(Debug, Default, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub enum RateLimitStore {
    Redis(RedisConfig),
    #[default]
    InMemory,
}

fn default_capacity() -> u32 {
    100
}

fn default_fill_frequency() -> Duration {
    Duration::from_secs(1)
}

impl Default for RateLimitConfig {
    fn default() -> Self {
        Self::Enabled {
            store: RateLimitStore::default(),
            limits: LimitConfig::default(),
        }
    }
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for RateLimitConfig {
    fn test_default() -> Self {
        Self::Disabled
    }
}

#[cfg(feature = "testing")]
pub fn enabled_for_test_redis() -> RateLimitConfig {
    use crate::tests::TestDefault;
    RateLimitConfig::Enabled {
        store: RateLimitStore::Redis(RedisConfig::default()),
        limits: LimitConfig::test_default(),
    }
}

#[cfg(feature = "testing")]
pub fn enabled_for_test_in_memory() -> RateLimitConfig {
    use crate::tests::TestDefault;
    RateLimitConfig::Enabled {
        store: RateLimitStore::InMemory,
        limits: LimitConfig::test_default(),
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
#[derive(Default)]
pub struct LimitConfig {
    pub per_user: TokenBucketConfig,
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for LimitConfig {
    fn test_default() -> Self {
        Self {
            per_user: TokenBucketConfig::test_default(),
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub struct TokenBucketConfig {
    #[serde(with = "humantime_serde", default = "default_fill_frequency")]
    pub fill_frequency: Duration,
    #[serde(default = "default_capacity")]
    pub capacity: u32,
}

impl Default for TokenBucketConfig {
    fn default() -> Self {
        Self {
            fill_frequency: default_fill_frequency(),
            capacity: default_capacity(),
        }
    }
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for TokenBucketConfig {
    fn test_default() -> Self {
        Self {
            fill_frequency: Duration::from_millis(500),
            capacity: 5,
        }
    }
}
