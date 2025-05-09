use std::time::Duration;

use serde::{Deserialize, Serialize};

use super::router::BalanceConfig;
use crate::{
    error::provider::ProviderError,
    types::{discover::DiscoverMode, provider::ProviderKeys},
};

#[derive(
    Debug, Default, Clone, Copy, PartialEq, Eq, Deserialize, Serialize,
)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub enum ProviderKeysSource {
    #[default]
    Env,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(default, deny_unknown_fields, rename_all = "kebab-case")]
pub struct DiscoverConfig {
    pub api_keys_source: ProviderKeysSource,
    pub discover_mode: DiscoverMode,
    #[serde(default = "default_discover_decay", with = "humantime_serde")]
    pub discover_decay: Duration,
    #[serde(default = "default_rtt", with = "humantime_serde")]
    pub default_rtt: Duration,
}

impl DiscoverConfig {
    pub fn provider_keys(
        &self,
        balance_config: &BalanceConfig,
    ) -> Result<ProviderKeys, ProviderError> {
        match self.api_keys_source {
            ProviderKeysSource::Env => ProviderKeys::from_env(balance_config),
        }
    }
}

impl Default for DiscoverConfig {
    fn default() -> Self {
        Self {
            api_keys_source: ProviderKeysSource::Env,
            discover_mode: DiscoverMode::Config,
            discover_decay: default_discover_decay(),
            default_rtt: default_rtt(),
        }
    }
}

fn default_discover_decay() -> Duration {
    Duration::from_secs(30)
}

fn default_rtt() -> Duration {
    Duration::from_secs(1)
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for DiscoverConfig {
    fn test_default() -> Self {
        // SAFETY: This must only be called within the single threaded tokio
        // runtime in tests
        unsafe {
            std::env::set_var("OPENAI_API_KEY", "sk-...");
            std::env::set_var("ANTHROPIC_API_KEY", "sk-...");
        }
        Self {
            api_keys_source: ProviderKeysSource::Env,
            discover_mode: DiscoverMode::Config,
            discover_decay: Duration::from_millis(100),
            default_rtt: Duration::from_millis(10),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn discover_config_round_trip() {
        let config = DiscoverConfig::default();
        let serialized = serde_json::to_string(&config).unwrap();
        let deserialized =
            serde_json::from_str::<DiscoverConfig>(&serialized).unwrap();
        assert_eq!(config, deserialized);
    }
}
