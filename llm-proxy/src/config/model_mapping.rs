use std::{collections::HashMap, str::FromStr};

use derive_more::AsRef;
use serde::{Deserialize, Serialize};

use crate::{error::init::InitError, types::{model::{Model, Version}, provider::Provider}};

// HashMap<TargetProvider, HashMap<SourceModel, TargetModel>>
/// A deserializable model mapping config. Strings are used for the keys
/// since YAML requires strings for keys.
/// 
/// The types in the hashmaps could be viewed as:
/// `HashMap<TargetProvider, HashMap<SourceModel, TargetModel>>`
#[derive(Debug, Clone, Deserialize, Serialize, AsRef)]
pub struct ModelMappingConfig(HashMap<Provider, HashMap<String, String>>);

#[derive(Debug, Clone)]
pub struct ModelMapper(HashMap<Provider, HashMap<Model, Model>>);

impl ModelMapper {
    pub fn get(&self, target_provider: &Provider, source_model: &Model) -> Option<Model> {
        let model_provider = source_model.provider();
        if model_provider.map_or(false, |p| p == *target_provider) {
            Some(source_model.clone())
        } else {
            self
                .0
                .get(&target_provider)
                .and_then(|m| m.get(source_model))
                .cloned()
        }
    }
}

impl TryFrom<ModelMappingConfig> for ModelMapper {
    type Error = InitError;

    fn try_from(value: ModelMappingConfig) -> Result<Self, Self::Error> {
        let mut mapper = HashMap::new();
        for (provider, mapping) in value.as_ref() {
            let mut provider_mapper = HashMap::new();
            for (source_model, target_model) in mapping {
                let source_model = Model::from_str(&source_model).map_err(InitError::InvalidModelMappingConfig)?;
                let mut target_model = Model::from_str(&target_model).map_err(InitError::InvalidModelMappingConfig)?;
                target_model.version = Some(Version::Latest);
                provider_mapper.insert(source_model, target_model);
            }
            mapper.insert(*provider, provider_mapper);
        }

        Ok(ModelMapper(mapper))
    }
}

impl Default for ModelMappingConfig {
    fn default() -> Self {
        Self(HashMap::from([
            (
                Provider::Anthropic,
                HashMap::from([
                    ("gpt-4o-mini".to_string(), "claude-3-5-haiku".to_string()),
                    (
                        "gpt-4.1-mini".to_string(),
                        "claude-3-5-haiku".to_string(),
                    ),
                    ("gpt-4o".to_string(), "claude-3-7-sonnet".to_string()),
                ]),
            ),
            (
                Provider::OpenAI,
                HashMap::from([
                    ("claude-3-5-haiku".to_string(), "gpt-4o-mini".to_string()),
                    ("claude-3-7-sonnet".to_string(), "gpt-4o".to_string()),
                ]),
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
