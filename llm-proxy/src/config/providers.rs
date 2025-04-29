use derive_more::{Deref, DerefMut};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use url::Url;

use crate::types::{
    model::{Model, Version},
    provider::Provider,
};

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct ProviderConfig {
    /// NOTE: In the future we can delete this field and
    /// instead load the models from the provider's respective APIs
    pub models: Vec<Model>,
    pub base_url: Url,
}

impl Default for ProviderConfig {
    fn default() -> Self {
        default_openai_provider_config()
    }
}

/// Map of *ALL* supported providers.
///
/// In order to configure subsets of providers use
#[derive(
    Debug, Clone, Deserialize, Serialize, Eq, PartialEq, Deref, DerefMut,
)]
#[serde(rename_all = "kebab-case")]
pub struct ProvidersConfig(IndexMap<Provider, ProviderConfig>);

impl Default for ProvidersConfig {
    fn default() -> Self {
        Self(IndexMap::from([
            (Provider::OpenAI, default_openai_provider_config()),
            (Provider::Anthropic, default_anthropic_provider_config()),
        ]))
    }
}

fn default_openai_provider_config() -> ProviderConfig {
    ProviderConfig {
        models: vec![Model::new("gpt-4o".to_string(), Some(Version::Latest))],
        base_url: Url::parse("https://api.openai.com").unwrap(),
    }
}

fn default_anthropic_provider_config() -> ProviderConfig {
    ProviderConfig {
        models: vec![Model::new(
            "claude-3-7-sonnet".to_string(),
            Some(Version::Latest),
        )],
        base_url: Url::parse("https://api.openai.com").unwrap(),
    }
}
