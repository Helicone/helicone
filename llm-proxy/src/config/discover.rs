use std::time::Duration;

use serde::{Deserialize, Serialize};

use super::providers::ProvidersConfig;
use crate::types::discover::DiscoverMode;

#[derive(Debug, Default, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(default, deny_unknown_fields, rename_all = "kebab-case")]
pub struct DiscoverConfig {
    pub discover_mode: DiscoverMode,
    pub providers: ProvidersConfig,
    #[serde(default = "default_discover_decay", with = "humantime_serde")]
    pub discover_decay: Duration,
}

fn default_discover_decay() -> Duration {
    Duration::from_secs(120)
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
