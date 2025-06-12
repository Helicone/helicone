use indexmap::IndexSet;
use thiserror::Error;

use crate::{
    config::{Config, router::RouterConfig},
    types::{
        model_id::ModelName, provider::InferenceProvider, router::RouterId,
    },
};

#[derive(Debug, Error)]
pub enum ModelMappingValidationError {
    #[error(
        "Provider {provider} referenced in router {router} balance config but \
         not found in global providers config"
    )]
    ProviderNotConfigured {
        router: RouterId,
        provider: InferenceProvider,
    },

    #[error(
        "No valid model mapping found for router {router}: model \
         {source_model} cannot be mapped to provider {target_provider}"
    )]
    NoValidMapping {
        router: RouterId,
        source_model: String,
        target_provider: InferenceProvider,
    },

    #[error("Model {model} in mapping config does not exist in any provider")]
    ModelNotFound { model: String },
}

impl Config {
    /// Validate that model mappings are complete for all possible routing
    /// scenarios
    pub fn validate_model_mappings(
        &self,
    ) -> Result<(), ModelMappingValidationError> {
        // First, validate that all models in mappings exist
        self.validate_mapping_models_exist()?;

        // Validate each router
        for (router_id, router_config) in self.routers.as_ref() {
            // Get all providers this router might use
            let router_providers = router_config.load_balance.providers();

            // Validate each provider exists in global config
            for provider in &router_providers {
                if !self.providers.contains_key(provider) {
                    return Err(
                        ModelMappingValidationError::ProviderNotConfigured {
                            router: router_id.clone(),
                            provider: *provider,
                        },
                    );
                }
            }

            let all_models_offered_by_configured_providers: IndexSet<
                ModelName,
            > = router_providers
                .iter()
                .flat_map(|provider| &self.providers[provider].models)
                .cloned()
                .collect();

            // For each provider this router might route to
            for target_provider in &router_providers {
                let target_provider_config = &self.providers[target_provider];

                for source_model in &all_models_offered_by_configured_providers
                {
                    self.can_map_model(
                        source_model,
                        *target_provider,
                        &target_provider_config.models,
                        router_id,
                        router_config,
                    )?;
                }
            }
        }

        Ok(())
    }

    /// Check if a model can be mapped to a target provider
    fn can_map_model(
        &self,
        source_model: &ModelName,
        target_provider: InferenceProvider,
        target_models: &IndexSet<ModelName<'static>>,
        router_id: &RouterId,
        router_config: &RouterConfig,
    ) -> Result<(), ModelMappingValidationError> {
        // 1. Direct support - target provider offers this model directly
        if target_models.contains(source_model) {
            return Ok(());
        }

        // 2. Router-specific mapping
        if let Some(router_mappings) = &router_config.model_mappings {
            if let Some(alternatives) =
                router_mappings.as_ref().get(source_model)
            {
                if alternatives.iter().any(|m| target_models.contains(m)) {
                    return Ok(());
                }
            }
        }

        // 3. Default mapping
        if let Some(alternatives) =
            self.default_model_mapping.as_ref().get(source_model)
        {
            if alternatives.iter().any(|m| target_models.contains(m)) {
                return Ok(());
            }
        }

        Err(ModelMappingValidationError::NoValidMapping {
            router: router_id.clone(),
            source_model: source_model.as_ref().to_string(),
            target_provider,
        })
    }

    fn validate_mapping_models_exist(
        &self,
    ) -> Result<(), ModelMappingValidationError> {
        let all_provider_models: IndexSet<&ModelName> =
            self.providers.values().flat_map(|p| &p.models).collect();

        // Check default mappings
        for (source_model, target_models) in self.default_model_mapping.as_ref()
        {
            if !all_provider_models.contains(source_model) {
                return Err(ModelMappingValidationError::ModelNotFound {
                    model: source_model.as_ref().to_string(),
                });
            }

            for target_model in target_models {
                if !all_provider_models.contains(target_model) {
                    return Err(ModelMappingValidationError::ModelNotFound {
                        model: target_model.as_ref().to_string(),
                    });
                }
            }
        }

        for router_config in self.routers.as_ref().values() {
            if let Some(router_mappings) = &router_config.model_mappings {
                for (source_model, target_models) in router_mappings.as_ref() {
                    if !all_provider_models.contains(source_model) {
                        return Err(
                            ModelMappingValidationError::ModelNotFound {
                                model: source_model.as_ref().to_string(),
                            },
                        );
                    }

                    for target_model in target_models {
                        if !all_provider_models.contains(target_model) {
                            return Err(
                                ModelMappingValidationError::ModelNotFound {
                                    model: target_model.as_ref().to_string(),
                                },
                            );
                        }
                    }
                }
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use super::*;
    use crate::config::{balance::BalanceConfig, router::RouterConfigs};

    #[test]
    fn default_config_passes_validation() {
        let config = Config::default();
        let result = config.validate_model_mappings();

        assert!(result.is_ok());
    }

    #[test]
    fn test_missing_provider_fails_validation() {
        let mut config = Config::default();

        config.providers.shift_remove(&InferenceProvider::Ollama);

        let mut router_config = RouterConfig::default();
        router_config.load_balance = BalanceConfig::from(HashMap::from([(
            crate::endpoints::EndpointType::Chat,
            crate::config::balance::BalanceConfigInner::Latency {
                targets: nonempty_collections::nes![InferenceProvider::Ollama],
            },
        )]));

        config.routers = RouterConfigs::new(HashMap::from([(
            RouterId::Default,
            router_config,
        )]));

        let result = config.validate_model_mappings();
        assert!(matches!(
            result,
            Err(ModelMappingValidationError::ProviderNotConfigured { .. })
        ));
    }

    #[test]
    fn test_can_map_model_error_no_valid_mapping() {
        let config = Config::default();

        let mut router_config = RouterConfig::default();
        router_config.model_mappings = None;

        let target_models = indexmap::IndexSet::from([
            ModelName::owned("gpt-4".to_string()),
            ModelName::owned("gpt-3.5-turbo".to_string()),
        ]);

        let source_model = ModelName::owned("claude-3-opus".to_string());

        let result = config.can_map_model(
            &source_model,
            InferenceProvider::OpenAI,
            &target_models,
            &RouterId::Default,
            &router_config,
        );

        assert!(matches!(
            result,
            Err(ModelMappingValidationError::NoValidMapping { .. })
        ));
    }
}
