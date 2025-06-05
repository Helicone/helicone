use std::str::FromStr;

use ollama_rest::models::chat::{ChatRequest, ChatResponse};

use super::{
    TryConvert, TryConvertStreamData, error::MapperError, model::ModelMapper,
};
use crate::types::{model_id::ModelId, provider::InferenceProvider};

pub struct OllamaConverter {
    model_mapper: ModelMapper,
}

impl OllamaConverter {
    #[must_use]
    pub fn new(model_mapper: ModelMapper) -> Self {
        Self { model_mapper }
    }
}

impl TryConvert<async_openai::types::CreateChatCompletionRequest, ChatRequest>
    for OllamaConverter
{
    type Error = MapperError;
    fn try_convert(
        &self,
        mut value: async_openai::types::CreateChatCompletionRequest,
    ) -> Result<ChatRequest, Self::Error> {
        let source_model = ModelId::from_str(&value.model)?;
        let target_model = self
            .model_mapper
            .map_model(&source_model, &InferenceProvider::GoogleGemini)?;
        tracing::trace!(source_model = ?source_model, target_model = ?target_model, "mapped model");

        value.model = target_model.to_string();

        todo!()
        // Ok(CreateChatCompletionRequestGemini(value))
    }
}

impl TryConvert<ChatResponse, async_openai::types::CreateChatCompletionResponse>
    for OllamaConverter
{
    type Error = MapperError;
    fn try_convert(
        &self,
        value: ChatResponse,
    ) -> Result<async_openai::types::CreateChatCompletionResponse, Self::Error>
    {
        todo!()
        // Ok(value)
    }
}

impl
    TryConvertStreamData<
        ChatResponse,
        async_openai::types::CreateChatCompletionStreamResponse,
    > for OllamaConverter
{
    type Error = MapperError;

    fn try_convert_chunk(
        &self,
        value: ChatResponse,
    ) -> Result<
        Option<async_openai::types::CreateChatCompletionStreamResponse>,
        Self::Error,
    > {
        todo!()
        // Ok(Some(value))
    }
}
