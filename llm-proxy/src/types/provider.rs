use std::sync::Arc;

use rustc_hash::FxHashMap as HashMap;
use serde::{Deserialize, Serialize};
use strum::{EnumIter, IntoEnumIterator};

use super::secret::Secret;
use crate::{
    config::{balance::BalanceConfig, router::RouterConfig},
    endpoints::ApiEndpoint,
    error::provider::ProviderError,
};

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
pub enum ModelProvider {
    #[default]
    #[serde(rename = "openai")]
    OpenAI,
    Anthropic,
    Amazon,
    Deepseek,
    Google,
}

impl std::fmt::Display for ModelProvider {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ModelProvider::OpenAI => write!(f, "openai"),
            ModelProvider::Anthropic => write!(f, "anthropic"),
            ModelProvider::Amazon => write!(f, "amazon"),
            ModelProvider::Deepseek => write!(f, "deepseek"),
            ModelProvider::Google => write!(f, "google")
        }
    }
}

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
pub enum InferenceProvider {
    #[default]
    #[serde(rename = "openai")]
    OpenAI,
    Anthropic,
    Bedrock,
    VertexAi,
    Google,
    // Ollama
}

impl InferenceProvider {
    #[must_use]
    pub fn endpoints(&self) -> Vec<ApiEndpoint> {
        match self {
            InferenceProvider::OpenAI => {
                crate::endpoints::openai::OpenAI::iter()
                    .map(ApiEndpoint::OpenAI)
                    .collect()
            }
            InferenceProvider::Anthropic => {
                crate::endpoints::anthropic::Anthropic::iter()
                    .map(ApiEndpoint::Anthropic)
                    .collect()
            }
            InferenceProvider::Google => {
                crate::endpoints::google::Google::iter()
                    .map(ApiEndpoint::Google)
                    .collect()
            },
            InferenceProvider::Bedrock | InferenceProvider::VertexAi => vec![],
        }
    }
}

impl std::fmt::Display for InferenceProvider {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            InferenceProvider::OpenAI => write!(f, "openai"),
            InferenceProvider::Anthropic => write!(f, "anthropic"),
            InferenceProvider::Bedrock => write!(f, "bedrock"),
            InferenceProvider::Google => write!(f, "google"),
            InferenceProvider::VertexAi => write!(f, "vertexai"),
        }
    }
}

#[derive(Debug, Clone)]
pub struct ProviderKeys(Arc<HashMap<InferenceProvider, Secret<String>>>);

impl std::ops::Deref for ProviderKeys {
    type Target = HashMap<InferenceProvider, Secret<String>>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl ProviderKeys {
    fn from_env_inner(
        balance_config: &BalanceConfig,
    ) -> Result<HashMap<InferenceProvider, Secret<String>>, ProviderError> {
        tracing::debug!("Discovering provider keys");
        let mut keys = HashMap::default();
        let providers = balance_config.providers();

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

        Ok(keys)
    }

    pub fn from_env(
        router_config: &Arc<RouterConfig>,
    ) -> Result<Self, ProviderError> {
        let mut keys = Self::from_env_inner(&router_config.balance)?;
        let default_provider = router_config.request_style;
        let provider_str = default_provider.to_string().to_uppercase();
        let env_var = format!("{provider_str}_API_KEY");
        if let Ok(key) = std::env::var(&env_var) {
            tracing::trace!(
                provider = %default_provider,
                "Got provider key"
            );
            keys.insert(default_provider, Secret(key));
        } else {
            return Err(ProviderError::ApiKeyNotFound(default_provider));
        }
        Ok(Self(Arc::new(keys)))
    }
}
