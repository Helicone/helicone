use std::sync::Arc;

use derive_more::AsRef;
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
    EnumIter,
)]
#[serde(rename_all = "kebab-case")]
pub enum Provider {
    #[default]
    #[serde(rename = "openai")]
    OpenAI,
    Anthropic,
    Bedrock,
    VertexAi,
    // Ollama? (assuming this means self-hosted)
}

impl std::fmt::Display for Provider {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Provider::OpenAI => write!(f, "openai"),
            Provider::Anthropic => write!(f, "anthropic"),
            Provider::Bedrock => write!(f, "bedrock"),
            Provider::VertexAi => write!(f, "vertexai"),
        }
    }
}

#[derive(Debug, Clone, AsRef)]
pub struct ProviderKeys(Arc<IndexMap<Provider, Secret<String>>>);

impl ProviderKeys {
    #[must_use]
    pub fn new(keys: IndexMap<Provider, Secret<String>>) -> Self {
        Self(Arc::new(keys))
    }

    pub fn from_env(
        balance_config: &BalanceConfig,
    ) -> Result<Self, ProviderError> {
        tracing::debug!("Discovering provider keys");
        let mut keys = IndexMap::new();
        let providers: Vec<Provider> = match balance_config {
            BalanceConfig::Weighted { targets } => {
                targets.iter().map(|t| t.provider).collect()
            }
            BalanceConfig::P2C { targets } => targets.iter().copied().collect(),
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
