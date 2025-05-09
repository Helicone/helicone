use std::collections::HashMap;

use derive_more::AsRef;
use indexmap::IndexSet;
use serde::{Deserialize, Serialize};

use super::providers::ProvidersConfig;
use crate::{
    app::AppState,
    middleware::mapper::error::MapperError,
    types::{
        model::{Model, ModelName},
        provider::InferenceProvider,
    },
};

#[derive(Debug, Clone, Deserialize, Serialize, AsRef)]
pub struct ModelMappingConfig(HashMap<InferenceProvider, ProviderModelMapping>);

#[derive(Debug, Clone, Deserialize, Serialize, AsRef)]
pub struct ProviderModelMapping {
    pub models: HashMap<ModelName<'static>, IndexSet<ModelName<'static>>>,
}

#[derive(Debug, Clone)]
pub struct ModelMapper<'a> {
    default_model_mapping: &'a ModelMappingConfig,
    provider_config: &'a ProvidersConfig,
}

impl<'a> ModelMapper<'a> {
    #[must_use]
    pub fn new(app_state: &'a AppState) -> Self {
        Self {
            default_model_mapping: &app_state.0.config.default_model_mapping,
            provider_config: &app_state.0.config.providers,
        }
    }
}

impl<'a> ModelMapper<'a> {
    pub fn get<'b>(
        &'a self,
        target_provider: &'b InferenceProvider,
        source_model: &'b Model,
    ) -> Result<ModelName<'b>, MapperError>
    where
        'b: 'a,
    {
        let target_provider_config = self
            .provider_config
            .get(target_provider)
            .ok_or(MapperError::NoProviderConfig(*target_provider))?;
        let source_model_name = ModelName::from_model(source_model);

        if target_provider_config.models.contains(&source_model_name) {
            return Ok(source_model_name);
        }

        let mapping_config = &self.default_model_mapping;
        let candidate_models = mapping_config
            .0
            .get(target_provider)
            .and_then(|m| m.models.get(&source_model_name))
            .ok_or_else(|| {
                MapperError::NoModelMapping(
                    *target_provider,
                    source_model.name.clone(),
                )
            })?;

        let target_model = candidate_models
            .iter()
            .find(|m| target_provider_config.models.contains(*m))
            .ok_or_else(|| {
                MapperError::NoModelMapping(
                    *target_provider,
                    source_model.name.clone(),
                )
            })?;

        Ok(target_model.clone())
    }
}

impl Default for ModelMappingConfig {
    fn default() -> Self {
        Self(HashMap::from([
            (
                InferenceProvider::Anthropic,
                ProviderModelMapping {
                    models: HashMap::from([
                        (
                            ModelName::borrowed("gpt-4o-mini"),
                            IndexSet::from([ModelName::borrowed(
                                "claude-3-haiku",
                            )]),
                        ),
                        (
                            ModelName::borrowed("gpt-4o"),
                            IndexSet::from([ModelName::borrowed(
                                "claude-3-7-sonnet",
                            )]),
                        ),
                    ]),
                },
            ),
            (
                InferenceProvider::OpenAI,
                ProviderModelMapping {
                    models: HashMap::from([
                        (
                            ModelName::borrowed("claude-3-haiku"),
                            IndexSet::from([ModelName::borrowed(
                                "gpt-4o-mini",
                            )]),
                        ),
                        (
                            ModelName::borrowed("claude-3-7-sonnet"),
                            IndexSet::from([ModelName::borrowed("gpt-4o")]),
                        ),
                        (
                            ModelName::borrowed("claude-3-5-sonnet"),
                            IndexSet::from([ModelName::borrowed(
                                "gpt-4o-mini",
                            )]),
                        ),
                    ]),
                },
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
