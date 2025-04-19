use derive_more::{AsRef, Display};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

use super::secret::Secret;

#[derive(
    Debug, Clone, Copy, Deserialize, Eq, Hash, PartialEq, Serialize, Display,
)]
#[serde(rename_all = "kebab-case")]
pub enum Provider {
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
pub struct ProviderKeys(IndexMap<Provider, Secret<String>>);

impl ProviderKeys {
    pub fn new(keys: IndexMap<Provider, Secret<String>>) -> Self {
        Self(keys)
    }
}
