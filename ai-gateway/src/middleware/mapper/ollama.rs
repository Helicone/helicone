use std::str::FromStr;

use async_openai::types::{
    CreateChatCompletionResponse, CreateChatCompletionStreamResponse,
};

use super::{TryConvert, TryConvertStreamData};
use crate::{
    endpoints::ollama::chat_completions::CreateChatCompletionRequestOllama,
    error::mapper::MapperError,
    middleware::mapper::model::ModelMapper,
    types::{model_id::ModelId, provider::InferenceProvider},
};

pub struct OllamaConverter {
    model_mapper: ModelMapper,
}

impl OllamaConverter {
    #[must_use]
    pub fn new(model_mapper: ModelMapper) -> Self {
        Self { model_mapper }
    }
}

impl
    TryConvert<
        async_openai::types::CreateChatCompletionRequest,
        CreateChatCompletionRequestOllama,
    > for OllamaConverter
{
    type Error = MapperError;
    fn try_convert(
        &self,
        mut value: async_openai::types::CreateChatCompletionRequest,
    ) -> Result<CreateChatCompletionRequestOllama, Self::Error> {
        let source_model = ModelId::from_str(&value.model)?;
        let target_model = self
            .model_mapper
            .map_model(&source_model, &InferenceProvider::Ollama)?;
        tracing::trace!(source_model = ?source_model, target_model = ?target_model, "mapped model");

        value.model = target_model.to_string();

        Ok(CreateChatCompletionRequestOllama(value))
    }
}

impl
    TryConvert<
        async_openai::types::CreateChatCompletionResponse,
        async_openai::types::CreateChatCompletionResponse,
    > for OllamaConverter
{
    type Error = MapperError;
    fn try_convert(
        &self,
        value: CreateChatCompletionResponse,
    ) -> Result<CreateChatCompletionResponse, Self::Error> {
        Ok(value)
    }
}

impl
    TryConvertStreamData<
        CreateChatCompletionStreamResponse,
        CreateChatCompletionStreamResponse,
    > for OllamaConverter
{
    type Error = MapperError;

    fn try_convert_chunk(
        &self,
        value: CreateChatCompletionStreamResponse,
    ) -> Result<Option<CreateChatCompletionStreamResponse>, Self::Error> {
        Ok(Some(value))
    }
}
