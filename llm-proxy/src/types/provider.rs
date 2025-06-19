use std::{str::FromStr, sync::Arc};

use rustc_hash::FxHashMap as HashMap;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use strum::{EnumIter, IntoEnumIterator};

use super::secret::Secret;
use crate::{
    config::{
        SDK, balance::BalanceConfig, providers::ProvidersConfig,
        router::RouterConfig,
    },
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
    strum::AsRefStr,
)]
#[strum(serialize_all = "kebab-case")]
pub enum InferenceProvider {
    #[default]
    #[strum(serialize = "openai")]
    OpenAI,
    Anthropic,
    Bedrock,
    Ollama,
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
            InferenceProvider::Ollama => {
                crate::endpoints::ollama::Ollama::iter()
                    .map(ApiEndpoint::Ollama)
                    .collect()
            }
            InferenceProvider::Bedrock => {
                crate::endpoints::bedrock::Bedrock::iter()
                    .map(ApiEndpoint::Bedrock)
                    .collect()
            }
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
        serializer.serialize_str(self.as_ref())
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum ProviderKey {
    Secret(Secret<String>),
    AwsCredentials {
        access_key: Secret<String>,
        secret_key: Secret<String>,
    },
}

impl ProviderKey {
    pub fn from_env(
        provider: InferenceProvider,
    ) -> Result<Self, ProviderError> {
        if provider == InferenceProvider::Bedrock {
            let access_key = Secret::from(
                std::env::var("AWS_ACCESS_KEY")
                    .map_err(|_| ProviderError::ApiKeyNotFound(provider))?,
            );
            let secret_key = Secret::from(
                std::env::var("AWS_SECRET_KEY")
                    .map_err(|_| ProviderError::ApiKeyNotFound(provider))?,
            );
            tracing::trace!(
                provider = %provider,
                "Got provider key"
            );
            Ok(ProviderKey::AwsCredentials {
                access_key,
                secret_key,
            })
        } else {
            let provider_str = provider.to_string().to_uppercase();
            let env_var = format!("{provider_str}_API_KEY");
            if let Ok(key) = std::env::var(&env_var) {
                tracing::trace!(
                    provider = %provider,
                    "Got provider key"
                );
                Ok(ProviderKey::Secret(Secret::from(key)))
            } else {
                Err(ProviderError::ApiKeyNotFound(provider))
            }
        }
    }
}

#[derive(Debug, Clone)]
pub struct ProviderKeys(Arc<HashMap<InferenceProvider, ProviderKey>>);

impl std::ops::Deref for ProviderKeys {
    type Target = HashMap<InferenceProvider, ProviderKey>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl ProviderKeys {
    fn from_env_inner(
        balance_config: &BalanceConfig,
    ) -> Result<HashMap<InferenceProvider, ProviderKey>, ProviderError> {
        tracing::debug!("Discovering provider keys");
        let mut keys = HashMap::default();
        let providers = balance_config.providers();

        for provider in providers {
            if provider == InferenceProvider::Ollama {
                // ollama doesn't require an API key
                tracing::debug!(
                    provider = %provider,
                    "from_env_inner ollama"
                );
                continue;
            }

            tracing::debug!(
                provider = %provider,
                "from_env_inner"
            );
            let key = ProviderKey::from_env(provider)?;
            keys.insert(provider, key);
        }

        Ok(keys)
    }

    pub fn from_env(
        router_config: &Arc<RouterConfig>,
    ) -> Result<Self, ProviderError> {
        let mut keys = Self::from_env_inner(&router_config.load_balance)?;
        let default_provider = SDK;
        let key = ProviderKey::from_env(default_provider)?;
        keys.insert(default_provider, key);
        Ok(Self(Arc::new(keys)))
    }

    pub fn from_env_direct_proxy(
        providers_config: &ProvidersConfig,
    ) -> Result<Self, ProviderError> {
        let mut keys = HashMap::default();
        for (provider, config) in providers_config.iter() {
            // ollama doesn't support API keys and bedrock
            if config.enabled && !matches!(provider, InferenceProvider::Ollama)
            {
                tracing::debug!(
                    provider = %provider,
                    "from_env_direct_proxy"
                );
                let key = ProviderKey::from_env(*provider)?;
                keys.insert(*provider, key);
            }
        }
        Ok(Self(Arc::new(keys)))
    }
}
