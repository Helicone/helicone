use indexmap::IndexMap;
use serde::Deserialize;
use url::Url;

use crate::types::request::Provider;

#[derive(Debug, Clone, Deserialize)]
pub struct DispatcherConfig {
    pub provider_urls: IndexMap<Provider, Url>,
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
