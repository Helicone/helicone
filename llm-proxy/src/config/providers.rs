use serde::{Deserialize, Serialize};

use crate::types::provider::Provider;

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct ProvidersConfig {
    pub providers: Vec<Provider>,
}

impl Default for ProvidersConfig {
    fn default() -> Self {
        Self {
            providers: vec![Provider::OpenAI, Provider::Anthropic],
        }
    }
}
