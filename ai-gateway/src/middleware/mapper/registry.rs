use crate::middleware::mapper::{
    TypedEndpointConverter, EndpointConverterRegistry, RegistryKey,
    openai_compatible::OpenAICompatibleConverter,
    anthropic::AnthropicConverter,
    gemini::GeminiConverter,
    bedrock::BedrockConverter,
};
use crate::endpoints::{self, openai::OpenAI};
use crate::inference_providers::InferenceProvider;
use crate::model_mapping::ModelMapper;
use std::sync::Arc;

pub struct EndpointConverterRegistryInner {
    // Implementation details...
}

impl EndpointConverterRegistryInner {
    pub fn default(model_mapper: Arc<ModelMapper>) -> EndpointConverterRegistryInner {
        let mut registry = EndpointConverterRegistryInner::new();

        // OpenAI converter
        let key = RegistryKey::new(
            ApiEndpoint::OpenAI(OpenAI::chat_completions()),
            ApiEndpoint::OpenAI(OpenAI::chat_completions()),
        );
        let converter = TypedEndpointConverter::<
            endpoints::openai::ChatCompletions,
            endpoints::openai::ChatCompletions,
            PassthroughConverter,
        >::new(PassthroughConverter::new());
        registry.register_converter(key, converter);

        // Anthropic converter
        let key = RegistryKey::new(
            ApiEndpoint::OpenAI(OpenAI::chat_completions()),
            ApiEndpoint::Anthropic(endpoints::anthropic::Anthropic::messages()),
        );
        let converter = TypedEndpointConverter::<
            endpoints::openai::ChatCompletions,
            endpoints::anthropic::Messages,
            AnthropicConverter,
        >::new(AnthropicConverter::new(
            InferenceProvider::Named("anthropic".into()),
            model_mapper.clone(),
        ));
        registry.register_converter(key, converter);

        // Gemini converter
        let key = RegistryKey::new(
            ApiEndpoint::OpenAI(OpenAI::chat_completions()),
            ApiEndpoint::Gemini(endpoints::gemini::Gemini::generate_content()),
        );
        let converter = TypedEndpointConverter::<
            endpoints::openai::ChatCompletions,
            endpoints::gemini::GenerateContent,
            GeminiConverter,
        >::new(GeminiConverter::new(
            InferenceProvider::Named("gemini".into()),
            model_mapper.clone(),
        ));
        registry.register_converter(key, converter);

        // Bedrock converter
        let key = RegistryKey::new(
            ApiEndpoint::OpenAI(OpenAI::chat_completions()),
            ApiEndpoint::Bedrock(endpoints::bedrock::Bedrock::invoke_model()),
        );
        let converter = TypedEndpointConverter::<
            endpoints::openai::ChatCompletions,
            endpoints::bedrock::InvokeModel,
            BedrockConverter,
        >::new(BedrockConverter::new(
            InferenceProvider::Named("bedrock".into()),
            model_mapper.clone(),
        ));
        registry.register_converter(key, converter);

        // Ollama converter (OpenAI compatible)
        let key = RegistryKey::new(
            ApiEndpoint::OpenAI(OpenAI::chat_completions()),
            ApiEndpoint::OpenAICompatible {
                provider: InferenceProvider::Named("ollama".into()),
                openai_endpoint: OpenAI::chat_completions(),
            },
        );
        let converter = TypedEndpointConverter::<
            endpoints::openai::ChatCompletions,
            endpoints::openai::OpenAICompatibleChatCompletions,
            OpenAICompatibleConverter,
        >::new(OpenAICompatibleConverter::new(
            InferenceProvider::Named("ollama".into()),
            model_mapper.clone(),
        ));
        registry.register_converter(key, converter);

        // Mistral converter (OpenAI compatible)
        let key = RegistryKey::new(
            ApiEndpoint::OpenAI(OpenAI::chat_completions()),
            ApiEndpoint::OpenAICompatible {
                provider: InferenceProvider::Named("mistral".into()),
                openai_endpoint: OpenAI::chat_completions(),
            },
        );
        let converter = TypedEndpointConverter::<
            endpoints::openai::ChatCompletions,
            endpoints::openai::OpenAICompatibleChatCompletions,
            OpenAICompatibleConverter,
        >::new(OpenAICompatibleConverter::new(
            InferenceProvider::Named("mistral".into()),
            model_mapper.clone(),
        ));
        registry.register_converter(key, converter);

        // NVIDIA Dynamo converter (OpenAI compatible)
        let key = RegistryKey::new(
            ApiEndpoint::OpenAI(OpenAI::chat_completions()),
            ApiEndpoint::OpenAICompatible {
                provider: InferenceProvider::Named("nvidia-dynamo".into()),
                openai_endpoint: OpenAI::chat_completions(),
            },
        );
        let converter = TypedEndpointConverter::<
            endpoints::openai::ChatCompletions,
            endpoints::openai::OpenAICompatibleChatCompletions,
            OpenAICompatibleConverter,
        >::new(OpenAICompatibleConverter::new(
            InferenceProvider::Named("nvidia-dynamo".into()),
            model_mapper.clone(),
        ));
        registry.register_converter(key, converter);

        registry
    }

    // Other methods...
}