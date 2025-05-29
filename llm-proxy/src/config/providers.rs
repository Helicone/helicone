use derive_more::{AsRef, Deref, DerefMut};
use indexmap::{IndexMap, IndexSet};
use serde::{Deserialize, Serialize};
use url::Url;

use crate::types::{model_id::ModelName, provider::InferenceProvider};

/// Global configuration for providers, shared across all routers.
///
/// For router-specific provider configuration, see [`RouterProviderConfgi`]
#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct GlobalProviderConfig {
    /// NOTE: In the future we can delete the `model` field and
    /// instead load the models from the provider's respective APIs
    pub models: IndexSet<ModelName<'static>>,
    pub base_url: Url,
    pub version: Option<String>,
}

impl Default for GlobalProviderConfig {
    fn default() -> Self {
        default_openai_provider_config()
    }
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
        Self(IndexMap::from([
            (InferenceProvider::OpenAI, default_openai_provider_config()),
            (
                InferenceProvider::Anthropic,
                default_anthropic_provider_config(),
            ),
            (
                InferenceProvider::GoogleGemini,
                default_google_provider_config(),
            ),
        ]))
    }
}

fn default_openai_provider_config() -> GlobalProviderConfig {
    GlobalProviderConfig {
        models: IndexSet::from([
            ModelName::borrowed("gpt-4o"),
            ModelName::borrowed("gpt-4o-mini"),
            ModelName::borrowed("gpt-4.1"),
            ModelName::borrowed("gpt-4.5"),
            ModelName::borrowed("o1"),
            ModelName::borrowed("o3"),
            ModelName::borrowed("o4-mini"),
        ]),
        base_url: Url::parse("https://api.openai.com").unwrap(),
        version: None,
    }
}

fn default_google_provider_config() -> GlobalProviderConfig {
    GlobalProviderConfig {
        models: IndexSet::from([
            ModelName::borrowed("gemini-1.5-flash"),
            ModelName::borrowed("gemini-2.0-flash"),
        ]),
        base_url: Url::parse("https://generativelanguage.googleapis.com")
            .unwrap(),
        version: None,
    }
}

fn default_anthropic_provider_config() -> GlobalProviderConfig {
    GlobalProviderConfig {
        models: IndexSet::from([
            ModelName::borrowed("claude-3-5-sonnet"),
            ModelName::borrowed("claude-3-7-sonnet"),
            ModelName::borrowed("claude-3-5-haiku"),
        ]),
        base_url: Url::parse("https://api.anthropic.com").unwrap(),
        version: Some(DEFAULT_ANTHROPIC_VERSION.to_string()),
    }
}

pub const DEFAULT_ANTHROPIC_VERSION: &str = "2023-06-01";
