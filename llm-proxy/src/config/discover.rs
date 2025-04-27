use std::time::Duration;

use serde::{Deserialize, Serialize};

use super::{ProviderKeysSource, providers::ProvidersConfig};
use crate::types::discover::DiscoverMode;

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(default, deny_unknown_fields, rename_all = "kebab-case")]
pub struct DiscoverConfig {
    pub api_keys_source: ProviderKeysSource,
    pub discover_mode: DiscoverMode,
    pub providers: ProvidersConfig,
    #[serde(default = "default_discover_decay", with = "humantime_serde")]
    pub discover_decay: Duration,
}

impl Default for DiscoverConfig {
    fn default() -> Self {
        Self {
            api_keys_source: ProviderKeysSource::Env,
            discover_mode: DiscoverMode::Config,
            providers: ProvidersConfig::default(),
            discover_decay: default_discover_decay(),
        }
    }
}

fn default_discover_decay() -> Duration {
    Duration::from_secs(120)
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for DiscoverConfig {
    fn test_default() -> Self {
        // SAFETY: This must only be called within the single threaded tokio
        // runtime in tests
        unsafe {
            std::env::set_var("OPENAI_API_KEY", "sk-...");
        }
        Self {
            api_keys_source: ProviderKeysSource::Env,
            discover_mode: DiscoverMode::Config,
            providers: ProvidersConfig::test_default(),
            discover_decay: default_discover_decay(),
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
