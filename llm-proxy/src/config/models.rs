use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

use crate::types::{
    model::{Model, Version},
    provider::Provider,
};

/// This will be replaced with a dynamic discovery of models from the provider's
/// APIs:
/// - https://docs.aws.amazon.com/bedrock/latest/APIReference/API_ListFoundationModels.html#API_ListFoundationModels_ResponseSyntax
/// - https://docs.anthropic.com/en/api/reference/models
/// - https://docs.openai.com/api-reference/models
/// - etc
#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct ModelsConfig(pub IndexMap<Provider, Vec<Model>>);

impl Default for ModelsConfig {
    fn default() -> Self {
        let openai_models = vec![
            Model::new("gpt-4o".to_string(), Some(Version::Latest)),
            Model::new("gpt-4o-mini".to_string(), Some(Version::Latest)),
        ];
        let anthropic_models = vec![
            Model::new("claude-3-5-sonnet".to_string(), Some(Version::Latest)),
            Model::new("claude-3-5-haiku".to_string(), Some(Version::Latest)),
        ];
        Self(IndexMap::from_iter([
            (Provider::OpenAI, openai_models),
            (Provider::Anthropic, anthropic_models),
        ]))
    }
}
