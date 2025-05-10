use crate::{
    app::AppState,
    config::{
        model_mapping::ModelMappingConfig, providers::ProvidersConfig,
        router::RouterConfig,
    },
    middleware::mapper::error::MapperError,
    types::{
        model::{Model, ModelName},
        provider::InferenceProvider,
    },
};

#[derive(Debug)]
pub struct ModelMapper<'a> {
    default_model_mapping: &'a ModelMappingConfig,
    providers_config: &'a ProvidersConfig,
    router_config: &'a RouterConfig,
}

impl<'a> ModelMapper<'a> {
    #[must_use]
    pub fn new(
        app_state: &'a AppState,
        router_config: &'a RouterConfig,
    ) -> Self {
        Self {
            default_model_mapping: &app_state.0.config.default_model_mapping,
            providers_config: &app_state.0.config.providers,
            router_config,
        }
    }
}

impl<'a> ModelMapper<'a> {
    /// Map a model to a new model name for a target provider.
    ///
    /// If the source model is offered by the target provider, return the source
    /// model name. Otherwise, use the model mapping from router config.
    /// If that doesn't have a mapping, use the default model mapping from the
    /// global config. (maybe we should put usage of the default mapping
    /// behind a flag so its up to the user,  although declaring mappings
    /// for _every_ model seems onerous)
    pub fn map_model<'b>(
        &'a self,
        target_provider: &'b InferenceProvider,
        source_model: &'b Model,
    ) -> Result<ModelName<'b>, MapperError>
    where
        'b: 'a,
    {
        let target_provider_models = &self
            .providers_config
            .get(target_provider)
            .ok_or(MapperError::NoProviderConfig(*target_provider))?
            .models;
        let source_model_name = ModelName::from_model(source_model);
        if target_provider_models.contains(&source_model_name) {
            return Ok(source_model_name);
        }
        // otherwise, use the model mapping from router config
        if let Some(router_model_mapping) = self
            .router_config
            .model_mappings
            .as_ref()
            .get(&source_model_name)
        {
            // get the first model from the router model mapping that the target
            // provider supports
            let target_model = router_model_mapping
                .iter()
                .find(|m| target_provider_models.contains(*m));
            if let Some(target_model) = target_model {
                return Ok(target_model.clone());
            }
        }
        // if that doesn't have a mapping, use the default model mapping
        let default_mapping = self
            .default_model_mapping
            .as_ref()
            .get(&source_model_name)
            .iter()
            .flat_map(|m| m.iter())
            .find(|m| target_provider_models.contains(*m))
            .ok_or(MapperError::NoModelMapping(
                *target_provider,
                source_model.name.clone(),
            ))?;
        Ok(default_mapping.clone())
    }
}
