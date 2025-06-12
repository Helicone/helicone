use std::time::Duration;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct DispatcherConfig {
    #[serde(default = "default_timeout", with = "humantime_serde")]
    pub timeout: Duration,
    #[serde(default = "default_connection_timeout", with = "humantime_serde")]
    pub connection_timeout: Duration,
}

impl Default for DispatcherConfig {
    fn default() -> Self {
        Self {
            timeout: default_timeout(),
            connection_timeout: default_connection_timeout(),
        }
    }
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for DispatcherConfig {
    fn test_default() -> Self {
        Self::default()
    }
}

fn default_timeout() -> Duration {
    Duration::from_secs(60 * 15)
}

fn default_connection_timeout() -> Duration {
    Duration::from_secs(10)
}
