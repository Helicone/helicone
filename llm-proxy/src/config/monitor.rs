use std::time::Duration;

use rust_decimal::{Decimal, prelude::FromPrimitive};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields, tag = "type", rename_all = "kebab-case")]
pub enum MonitorConfig {
    ErrorRatio {
        /// The ratio of 5xx errors to requests that will trigger a provider
        /// to be marked as unhealthy.
        #[serde(default = "default_ratio")]
        ratio: Decimal,
        /// The window over which to measure the error ratio.
        #[serde(default = "default_window", with = "humantime_serde")]
        window: Duration,
        /// The number of buckets to use for the rolling window.
        #[serde(default = "default_buckets")]
        buckets: usize,
        /// Interval to check if providers have changed health status.
        #[serde(default = "default_interval", with = "humantime_serde")]
        interval: Duration,
        /// The grace period to wait before removing a provider from the load
        /// balancer.
        #[serde(default = "default_grace_period")]
        grace_period: GracePeriod,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields, untagged, rename_all = "kebab-case")]
pub enum GracePeriod {
    Requests {
        /// The minimum number of requests that must be made before the grace
        /// period is considered over.
        min_requests: u32,
    },
}

fn default_grace_period() -> GracePeriod {
    GracePeriod::Requests { min_requests: 20 }
}

fn default_interval() -> Duration {
    Duration::from_secs(10)
}

fn default_buckets() -> usize {
    10
}

fn default_window() -> Duration {
    Duration::from_secs(60)
}

fn default_ratio() -> Decimal {
    Decimal::from_f64(0.10).unwrap()
}

impl Default for MonitorConfig {
    fn default() -> Self {
        Self::ErrorRatio {
            ratio: default_ratio(),
            window: default_window(),
            buckets: default_buckets(),
            interval: default_interval(),
            grace_period: default_grace_period(),
        }
    }
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for MonitorConfig {
    fn test_default() -> Self {
        Self::ErrorRatio {
            ratio: Decimal::from_f64(0.02).unwrap(),
            window: Duration::from_millis(100),
            buckets: 10,
            interval: Duration::from_millis(1),
            grace_period: GracePeriod::Requests { min_requests: 10 },
        }
    }
}
