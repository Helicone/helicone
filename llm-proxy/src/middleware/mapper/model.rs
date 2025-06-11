use std::sync::Arc;

use crate::{
    app_state::AppState,
    config::{
        model_mapping::ModelMappingConfig, providers::ProvidersConfig,
        router::RouterConfig,
    },
    middleware::mapper::error::MapperError,
    types::{
        model_id::{ModelId, ModelName},
        provider::InferenceProvider,
    },
};

#[derive(Debug, Clone)]
pub struct ModelMapper {
    app_state: AppState,
    router_config: Arc<RouterConfig>,
}

impl ModelMapper {
    #[must_use]
    pub fn new(app_state: AppState, router_config: Arc<RouterConfig>) -> Self {
        Self {
            app_state,
            router_config,
        }
    }

    fn default_model_mapping(&self) -> &ModelMappingConfig {
        &self.app_state.0.config.default_model_mapping
    }

    fn providers_config(&self) -> &ProvidersConfig {
        &self.app_state.0.config.providers
    }

    /// Map a model to a new model name for a target provider.
    ///
    /// If the source model is offered by the target provider, return the source
    /// model name. Otherwise, use the model mapping from router config.
    /// If that doesn't have a mapping, use the default model mapping from the
    /// global config. (maybe we should put usage of the default mapping
    /// behind a flag so its up to the user,  although declaring mappings
    /// for _every_ model seems onerous)
    pub fn map_model(
        &self,
        source_model: &ModelId,
        target_provider: &InferenceProvider,
    ) -> Result<ModelId, MapperError> {
        let models_offered_by_target_provider = &self
            .providers_config()
            .get(target_provider)
            .ok_or(MapperError::NoProviderConfig(*target_provider))?
            .models;
        let source_model_name = ModelName::from_model(source_model);
        if models_offered_by_target_provider.contains(&source_model_name) {
            return Ok(source_model.clone());
        }
        // otherwise, use the model mapping from router config if it exists
        if let Some(router_model_mapping) = self
            .router_config
            .model_mappings()
            .and_then(|m| m.as_ref().get(&source_model_name))
        {
            // get the first model from the router model mapping that the target
            // provider supports
            let target_model = router_model_mapping
                .iter()
                .find(|m| models_offered_by_target_provider.contains(*m));
            if let Some(target_model) = target_model {
                // the parsed model id here will use the "latest" version
                return ModelId::from_str_and_provider(
                    *target_provider,
                    target_model.as_ref(),
                );
            }
        }
        // if that doesn't have a mapping, use the default model mapping
        let default_mapping = self
            .default_model_mapping()
            .as_ref()
            .get(&source_model_name)
            .iter()
            .flat_map(|m| m.iter())
            .find(|m| models_offered_by_target_provider.contains(*m))
            .ok_or(MapperError::NoModelMapping(
                *target_provider,
                source_model_name.as_ref().to_string(),
            ))?;
        ModelId::from_str_and_provider(
            *target_provider,
            default_mapping.as_ref(),
        )
    }
}
