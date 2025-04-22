use std::time::Duration;

use serde::{Deserialize, Serialize};

use super::models::ModelsConfig;
use crate::types::discover::DiscoverMode;

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
#[serde(default, deny_unknown_fields, rename_all = "kebab-case")]
pub struct DiscoverConfig {
    pub discover_mode: DiscoverMode,
    pub providers: crate::config::providers::ProvidersConfig,
    #[serde(default = "default_discover_decay", with = "humantime_serde")]
    pub discover_decay: Duration,
    /// NOTE: In the future we will delete this field and
    /// instead load the models from the provider's respective APIs
    pub models: ModelsConfig,
}

fn default_discover_decay() -> Duration {
    Duration::from_secs(600)
}
