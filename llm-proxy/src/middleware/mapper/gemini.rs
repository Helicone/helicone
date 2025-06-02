use std::str::FromStr;

use async_openai::types::{
    CreateChatCompletionResponse, CreateChatCompletionStreamResponse,
};

use super::{
    TryConvert, TryConvertStreamData, error::MapperError, model::ModelMapper,
};
use crate::{
    endpoints::google::generate_contents::CreateChatCompletionRequestGemini,
    types::{model_id::ModelId, provider::InferenceProvider},
};

pub struct GoogleGeminiConverter {
    model_mapper: ModelMapper,
}

impl GoogleGeminiConverter {
    #[must_use]
    pub fn new(model_mapper: ModelMapper) -> Self {
        Self { model_mapper }
    }
}

impl
    TryConvert<
        async_openai::types::CreateChatCompletionRequest,
        CreateChatCompletionRequestGemini,
    > for GoogleGeminiConverter
{
    type Error = MapperError;
    fn try_convert(
        &self,
        mut value: async_openai::types::CreateChatCompletionRequest,
    ) -> Result<CreateChatCompletionRequestGemini, Self::Error> {
        let source_model = ModelId::from_str(&value.model)?;
        let target_model = self
            .model_mapper
            .map_model(&source_model, &InferenceProvider::GoogleGemini)?;
        tracing::trace!(source_model = ?source_model, target_model = ?target_model, "mapped model");

        value.model = target_model.to_string();

        Ok(CreateChatCompletionRequestGemini(value))
    }
}

impl
    TryConvert<
        async_openai::types::CreateChatCompletionResponse,
        async_openai::types::CreateChatCompletionResponse,
    > for GoogleGeminiConverter
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
    > for GoogleGeminiConverter
{
    type Error = MapperError;

    fn try_convert_chunk(
        &self,
        value: CreateChatCompletionStreamResponse,
    ) -> Result<Option<CreateChatCompletionStreamResponse>, Self::Error> {
        Ok(Some(value))
    }
}
