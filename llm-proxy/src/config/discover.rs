use serde::{Deserialize, Serialize};

use super::models::ModelsConfig;
use crate::types::discover::DiscoverMode;

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
#[serde(default, deny_unknown_fields, rename_all = "kebab-case")]
pub struct DiscoverConfig {
    pub discover_mode: DiscoverMode,

    /// NOTE: In the future we will delete this field and
    /// instead load the models from the provider's respective APIs
    pub models: ModelsConfig,
}
