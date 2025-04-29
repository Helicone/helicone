use std::collections::HashMap;

use derive_more::AsRef;
use serde::{Deserialize, Serialize};

use crate::types::provider::Provider;

// HashMap<(TargetProvider, SourceModel), TargetModel>
#[derive(Debug, Clone, Deserialize, Serialize, AsRef)]
pub struct ModelMappingConfig(HashMap<(Provider, String), String>);

impl Default for ModelMappingConfig {
    fn default() -> Self {
        Self(HashMap::from([
            (
                (Provider::Anthropic, "gpt-4o-mini".to_string()),
                "claude-3-5-haiku".to_string(),
            ),
            (
                (Provider::Anthropic, "gpt-4.1-mini".to_string()),
                "claude-3-5-haiku".to_string(),
            ),
            (
                (Provider::Anthropic, "gpt-4o".to_string()),
                "claude-3-7-sonnet".to_string(),
            ),
            (
                (Provider::OpenAI, "claude-3-5-haiku".to_string()),
                "gpt-4o-mini".to_string(),
            ),
            (
                (Provider::OpenAI, "claude-3-7-sonnet".to_string()),
                "gpt-4o".to_string(),
            ),
        ]))
    }
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for ModelMappingConfig {
    fn test_default() -> Self {
        Self::default()
    }
}
