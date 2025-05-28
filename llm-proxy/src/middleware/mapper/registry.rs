use std::sync::Arc;

use rustc_hash::FxHashMap as HashMap;

use super::{
    EndpointConverter, NoOpConverter, TypedEndpointConverter,
    anthropic::AnthropicConverter, google::GoogleConverter, model::ModelMapper,
    openai::OpenAiConverter,
};
use crate::{
    config::router::RouterConfig,
    endpoints::{
        self, ApiEndpoint, anthropic::Anthropic, google::Google, openai::OpenAI,
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
    ) -> Option<&(dyn EndpointConverter + Send + Sync + 'static)> {
        self.0
            .converters
            .get(&RegistryKey::new(*source_endpoint, *target_endpoint))
            .map(|v| &**v)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct RegistryKey {
    source_endpoint: ApiEndpoint,
    target_endpoint: ApiEndpoint,
}

impl RegistryKey {
    fn new(source_endpoint: ApiEndpoint, target_endpoint: ApiEndpoint) -> Self {
        Self {
            source_endpoint,
            target_endpoint,
        }
    }
}

struct EndpointConverterRegistryInner {
    /// In the future when we support other APIs beside just chat completion
    /// we'll want to add another level here.
    converters: HashMap<
        RegistryKey,
        Box<dyn EndpointConverter + Send + Sync + 'static>,
    >,
}

impl std::fmt::Debug for EndpointConverterRegistryInner {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("EndpointConverterRegistryInner")
            .finish_non_exhaustive()
    }
}

impl EndpointConverterRegistryInner {
    #[allow(clippy::too_many_lines)]
    fn new(router_config: &RouterConfig, model_mapper: ModelMapper) -> Self {
        let mut registry = Self {
            converters: HashMap::default(),
        };
        let providers = router_config.balance.providers();
        let request_style = router_config.request_style;

        if request_style == InferenceProvider::OpenAI
            && providers.contains(&InferenceProvider::Anthropic)
        {
            let key = RegistryKey::new(
                ApiEndpoint::OpenAI(OpenAI::chat_completions()),
                ApiEndpoint::Anthropic(Anthropic::messages()),
            );
            registry.register_converter(
                key,
                TypedEndpointConverter {
                    converter: AnthropicConverter::new(model_mapper.clone()),
                    _phantom: std::marker::PhantomData::<(
                        endpoints::openai::ChatCompletions,
                        endpoints::anthropic::Messages,
                    )>,
                },
            );
            let key = RegistryKey::new(
                ApiEndpoint::OpenAI(OpenAI::chat_completions()),
                ApiEndpoint::Anthropic(Anthropic::messages()),
            );
            registry.register_converter(
                key,
                TypedEndpointConverter {
                    converter: AnthropicConverter::new(model_mapper.clone()),
                    _phantom: std::marker::PhantomData::<(
                        endpoints::openai::ChatCompletions,
                        endpoints::anthropic::Messages,
                    )>,
                },
            );
        } else if request_style == InferenceProvider::Anthropic
            && providers.contains(&InferenceProvider::OpenAI)
        {
            let key = RegistryKey::new(
                ApiEndpoint::Anthropic(Anthropic::messages()),
                ApiEndpoint::OpenAI(OpenAI::chat_completions()),
            );
            registry.register_converter(
                key,
                TypedEndpointConverter {
                    converter: OpenAiConverter::new(model_mapper),
                    _phantom: std::marker::PhantomData::<(
                        endpoints::anthropic::Messages,
                        endpoints::openai::ChatCompletions,
                    )>,
                },
            );
        } else if request_style == InferenceProvider::OpenAI
            && providers.contains(&InferenceProvider::GoogleGemini)
        {
            let key = RegistryKey::new(
                ApiEndpoint::OpenAI(OpenAI::chat_completions()),
                ApiEndpoint::Google(Google::generate_contents()),
            );

            registry.register_converter(
                key,
                TypedEndpointConverter {
                    converter: GoogleConverter::new(model_mapper.clone()),
                    _phantom: std::marker::PhantomData::<(
                        endpoints::openai::ChatCompletions,
                        endpoints::openai::ChatCompletions,
                    )>,
                },
            );

            let key = RegistryKey::new(
                ApiEndpoint::OpenAI(OpenAI::chat_completions()),
                ApiEndpoint::Google(Google::generate_contents()),
            );

            registry.register_converter(
                key,
                TypedEndpointConverter {
                    converter: GoogleConverter::new(model_mapper.clone()),
                    _phantom: std::marker::PhantomData::<(
                        endpoints::openai::ChatCompletions,
                        endpoints::openai::ChatCompletions,
                    )>,
                },
            );
        }
        if request_style == InferenceProvider::OpenAI
            && providers.contains(&InferenceProvider::OpenAI)
        {
            let key = RegistryKey::new(
                ApiEndpoint::OpenAI(OpenAI::chat_completions()),
                ApiEndpoint::OpenAI(OpenAI::chat_completions()),
            );
            registry.register_converter(
                key,
                NoOpConverter {
                    _phantom: std::marker::PhantomData::<
                        endpoints::openai::ChatCompletions,
                    >,
                },
            );
        } else if request_style == InferenceProvider::Anthropic
            && providers.contains(&InferenceProvider::Anthropic)
        {
            let key = RegistryKey::new(
                ApiEndpoint::Anthropic(Anthropic::messages()),
                ApiEndpoint::Anthropic(Anthropic::messages()),
            );
            registry.register_converter(
                key,
                NoOpConverter {
                    _phantom: std::marker::PhantomData::<
                        endpoints::anthropic::Messages,
                    >,
                },
            );
        } else if request_style == InferenceProvider::GoogleGemini
            && providers.contains(&InferenceProvider::GoogleGemini)
        {
            let key = RegistryKey::new(
                ApiEndpoint::Google(Google::generate_contents()),
                ApiEndpoint::Google(Google::generate_contents()),
            );
            registry.register_converter(
                key,
                NoOpConverter {
                    _phantom: std::marker::PhantomData::<
                        endpoints::google::GenerateContents,
                    >,
                },
            );
        }
        registry
    }

    fn register_converter<C>(&mut self, key: RegistryKey, converter: C)
    where
        C: EndpointConverter + Send + Sync + 'static,
    {
        self.converters.insert(key, Box::new(converter));
    }
}
