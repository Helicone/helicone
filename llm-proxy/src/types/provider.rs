use derive_more::{AsRef, Display};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

use super::secret::Secret;

#[derive(
    Debug, Display, Clone, Copy, Deserialize, Eq, Hash, PartialEq, Serialize,
)]
#[serde(rename_all = "kebab-case")]
#[display("{}", self)]
pub enum Provider {
    #[serde(rename = "openai")]
    OpenAI,
    Anthropic,
}

#[derive(Debug, Clone, AsRef)]
pub struct ProviderKeys(IndexMap<Provider, Secret<String>>);

impl ProviderKeys {
    pub fn new(keys: IndexMap<Provider, Secret<String>>) -> Self {
        Self(keys)
    }
}
