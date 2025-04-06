use indexmap::IndexMap;
use serde::Deserialize;
use url::Url;

use super::request::Provider;

pub mod rate_limit;
pub mod retry;
pub mod router;
pub mod template;

#[derive(Debug, Default, Clone, Deserialize)]
pub struct WorkerConfig {
    pub dispatcher: DispatcherConfig,
}

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
