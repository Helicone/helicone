use derive_more::Deref;
use serde::{Deserialize, Serialize};

use crate::types::provider::Provider;

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq, Deref)]
#[serde(rename_all = "kebab-case")]
pub struct ProvidersConfig(Vec<Provider>);

impl Default for ProvidersConfig {
    fn default() -> Self {
        Self(vec![Provider::OpenAI, Provider::Anthropic])
    }
}
