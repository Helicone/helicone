use std::{collections::HashMap, sync::Arc};

use serde::{Serialize, de::DeserializeOwned};

use super::{
    EndpointConverter, TryConvert, TypedEndpointConverter,
    anthropic::ToAnthropicConverter, error::MapperError, model::ModelMapper,
    openai::ToOpenAiConverter,
};
use crate::{
    config::router::RouterConfig,
    endpoints::{
        self, ApiEndpoint, Endpoint, anthropic::Anthropic, openai::OpenAI,
    },
    types::provider::InferenceProvider,
};

#[derive(Debug, Clone)]
pub struct EndpointConverterRegistry(Arc<EndpointConverterRegistryInner>);

impl EndpointConverterRegistry {
    #[must_use]
    pub fn new(
        router_config: &RouterConfig,
        model_mapper: ModelMapper,
    ) -> Self {
        let inner =
            EndpointConverterRegistryInner::new(router_config, model_mapper);
        Self(Arc::new(inner))
    }

    #[must_use]
    pub fn get_converter(
        &self,
        source_endpoint: &ApiEndpoint,
        target_endpoint: &ApiEndpoint,
    ) -> Option<&(dyn EndpointConverter + Send + Sync)> {
        self.0
            .converters
            .get(&(*source_endpoint, *target_endpoint))
            .map(|v| &**v)
    }
}

struct EndpointConverterRegistryInner {
    /// In the future when we support other APIs beside just chat completion
    /// we'll want to add another level here.
    converters: HashMap<
        (ApiEndpoint, ApiEndpoint),
        Box<dyn EndpointConverter + Send + Sync>,
    >,
}

impl std::fmt::Debug for EndpointConverterRegistryInner {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("EndpointConverterRegistryInner")
            .finish_non_exhaustive()
    }
}

impl EndpointConverterRegistryInner {
    fn new(router_config: &RouterConfig, model_mapper: ModelMapper) -> Self {
        let mut registry = Self {
            converters: HashMap::new(),
        };
        let providers = router_config.balance.providers();
        let request_style = router_config.request_style;

        if request_style == InferenceProvider::OpenAI
            && providers.contains(&InferenceProvider::Anthropic)
        {
            registry.register_converter::<_, _, _>(
                ApiEndpoint::OpenAI(OpenAI::chat_completions()),
                ApiEndpoint::Anthropic(Anthropic::messages()),
                TypedEndpointConverter {
                    converter: ToAnthropicConverter::new(model_mapper),
                    _phantom: std::marker::PhantomData::<(
                        endpoints::openai::ChatCompletions,
                        endpoints::anthropic::Messages,
                    )>,
                },
            );
        } else if request_style == InferenceProvider::Anthropic
            && providers.contains(&InferenceProvider::OpenAI)
        {
            registry.register_converter::<_, _, _>(
                ApiEndpoint::Anthropic(Anthropic::messages()),
                ApiEndpoint::OpenAI(OpenAI::chat_completions()),
                TypedEndpointConverter {
                    converter: ToOpenAiConverter::new(model_mapper.clone()),
                    _phantom: std::marker::PhantomData::<(
                        endpoints::anthropic::Messages,
                        endpoints::openai::ChatCompletions,
                    )>,
                },
            );
        }

        registry
    }

    fn register_converter<S, T, C>(
        &mut self,
        source_endpoint: ApiEndpoint,
        target_endpoint: ApiEndpoint,
        converter: TypedEndpointConverter<S, T, C>,
    ) where
        S: Endpoint + Send + Sync + 'static,
        S::RequestBody: DeserializeOwned,
        T: Endpoint + Send + Sync + 'static,
        T::RequestBody: Serialize,
        C: TryConvert<S::RequestBody, T::RequestBody> + Send + Sync + 'static,
        <C as TryConvert<S::RequestBody, T::RequestBody>>::Error:
            Into<MapperError>,
    {
        self.converters
            .insert((source_endpoint, target_endpoint), Box::new(converter));
    }
}
