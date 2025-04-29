use std::sync::Arc;

use derive_more::{AsRef, Display};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use strum::EnumIter;

use super::secret::Secret;
use crate::{config::router::BalanceConfig, error::provider::ProviderError};

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

    pub fn from_env(
        balance_config: &BalanceConfig,
    ) -> Result<Self, ProviderError> {
        let mut keys = IndexMap::new();
        let providers: Vec<Provider> = match balance_config {
            BalanceConfig::Weighted { targets } => {
                targets.iter().map(|t| t.key.provider).collect()
            }
            BalanceConfig::P2C { targets } => {
                targets.iter().map(|provider| *provider).collect()
            }
        };

        for provider in providers {
            let provider_str = provider.to_string().to_uppercase();
            let env_var = format!("{provider_str}_API_KEY");
            if let Ok(key) = std::env::var(&env_var) {
                tracing::trace!(
                    provider = %provider,
                    "Got provider key"
                );
                keys.insert(provider, Secret(key));
            } else {
                return Err(ProviderError::ApiKeyNotFound(provider));
            }
        }

        Ok(Self(Arc::new(keys)))
    }
}
