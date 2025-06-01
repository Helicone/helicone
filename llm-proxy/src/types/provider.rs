use std::{str::FromStr, sync::Arc};

use rustc_hash::FxHashMap as HashMap;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
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
    Eq,
    Hash,
    PartialEq,
    EnumIter,
    strum::Display,
    strum::EnumString,
)]
#[strum(serialize_all = "kebab-case")]
pub enum ModelProvider {
    #[default]
    OpenAI,
    Anthropic,
    Amazon,
    Deepseek,
    Google,
}

impl<'de> Deserialize<'de> for ModelProvider {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        ModelProvider::from_str(&s).map_err(serde::de::Error::custom)
    }
}

impl Serialize for ModelProvider {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[derive(
    Debug,
    Clone,
    Default,
    Copy,
    Eq,
    Hash,
    PartialEq,
    EnumIter,
    strum::Display,
    strum::EnumString,
)]
#[strum(serialize_all = "kebab-case")]
pub enum InferenceProvider {
    #[default]
    #[strum(serialize = "openai")]
    OpenAI,
    Anthropic,
    Bedrock,
    Ollama,
    VertexAi,
    #[strum(serialize = "gemini")]
    GoogleGemini,
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
            InferenceProvider::GoogleGemini => {
                crate::endpoints::google::Google::iter()
                    .map(ApiEndpoint::Google)
                    .collect()
            }
            // Inference not supported yet for these providers
            InferenceProvider::Bedrock
            | InferenceProvider::VertexAi
            | InferenceProvider::Ollama => vec![],
        }
    }
}

impl<'de> Deserialize<'de> for InferenceProvider {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        InferenceProvider::from_str(&s).map_err(serde::de::Error::custom)
    }
}

impl Serialize for InferenceProvider {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
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
