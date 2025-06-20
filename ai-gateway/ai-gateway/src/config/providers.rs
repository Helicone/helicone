use derive_more::{AsRef, Deref, DerefMut};
use indexmap::{IndexMap, IndexSet};
use serde::{Deserialize, Serialize};
use url::Url;

use crate::types::{model_id::ModelName, provider::InferenceProvider};

const PROVIDERS_YAML: &str =
    include_str!("../../config/embedded/providers.yaml");
pub(crate) const DEFAULT_ANTHROPIC_VERSION: &str = "2023-06-01";

/// Global configuration for providers, shared across all routers.
///
/// For router-specific provider configuration, see [`RouterProviderConfig`]
#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct GlobalProviderConfig {
    /// NOTE: In the future we can delete the `model` field and
    /// instead load the models from the provider's respective APIs
    pub models: IndexSet<ModelName<'static>>,
    pub base_url: Url,
    #[serde(default)]
    pub version: Option<String>,
    #[serde(default)]
    pub enabled: bool,
}

/// Map of *ALL* supported providers.
///
/// In order to configure subsets of providers use
#[derive(
    Debug, Clone, Deserialize, Serialize, Eq, PartialEq, Deref, DerefMut, AsRef,
)]
#[serde(rename_all = "kebab-case")]
pub struct ProvidersConfig(IndexMap<InferenceProvider, GlobalProviderConfig>);

impl FromIterator<(InferenceProvider, GlobalProviderConfig)>
    for ProvidersConfig
{
    fn from_iter<T>(iter: T) -> Self
    where
        T: IntoIterator<Item = (InferenceProvider, GlobalProviderConfig)>,
    {
        Self(IndexMap::from_iter(iter))
    }
}

impl Default for ProvidersConfig {
    fn default() -> Self {
        serde_yml::from_str(PROVIDERS_YAML).expect("Always valid if tests pass")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_providers_config_loads_from_yaml_string() {
        let _default_config = ProvidersConfig::default();
        // just want to make sure we don't panic...
    }
}
