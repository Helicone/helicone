use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use url::Url;

use crate::{error::internal::InternalError, types::provider::Provider};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct DispatcherConfig {
    pub provider_urls: IndexMap<Provider, Url>,
}

impl DispatcherConfig {
    pub fn get_provider_url(
        &self,
        provider: Provider,
    ) -> Result<&Url, InternalError> {
        self.provider_urls
            .get(&provider)
            .ok_or(InternalError::ProviderNotConfigured(provider))
    }
}

impl Default for DispatcherConfig {
    fn default() -> Self {
        let provider_urls = IndexMap::from([
            (
                Provider::OpenAI,
                Url::parse("https://api.openai.com").unwrap(),
            ),
            (
                Provider::Anthropic,
                Url::parse("https://api.anthropic.com").unwrap(),
            ),
        ]);
        Self { provider_urls }
    }
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for DispatcherConfig {
    fn test_default() -> Self {
        Self::default()
    }
}
