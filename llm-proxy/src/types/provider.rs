use std::sync::Arc;

use derive_more::{AsRef, Display};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use strum::{EnumIter, IntoEnumIterator};

use super::secret::Secret;

#[derive(
    Debug,
    Clone,
    Default,
    Copy,
    Deserialize,
    Eq,
    Hash,
    PartialEq,
    Serialize,
    Display,
    EnumIter,
)]
#[serde(rename_all = "kebab-case")]
pub enum Provider {
    #[default]
    #[serde(rename = "openai")]
    #[display("openai")]
    OpenAI,
    #[display("anthropic")]
    Anthropic,
    #[display("bedrock")]
    Bedrock,
    #[display("vertexai")]
    VertexAi,
    // Ollama? (assuming this means self-hosted)
}

#[derive(Debug, Clone, AsRef)]
pub struct ProviderKeys(Arc<IndexMap<Provider, Secret<String>>>);

impl ProviderKeys {
    pub fn new(keys: IndexMap<Provider, Secret<String>>) -> Self {
        Self(Arc::new(keys))
    }

    pub fn from_env() -> Self {
        let mut keys = IndexMap::new();
        for provider in Provider::iter() {
            let provider_str = provider.to_string().to_uppercase();
            if let Ok(key) = std::env::var(format!("{provider_str}_API_KEY")) {
                keys.insert(provider, Secret(key));
            }
        }

        Self(Arc::new(keys))
    }
}
