use std::time::Duration;

use serde::{Deserialize, Serialize};

use super::providers::ProvidersConfig;
use crate::types::discover::DiscoverMode;

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
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
