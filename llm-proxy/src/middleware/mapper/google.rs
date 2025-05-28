use async_openai::types::{
    CreateChatCompletionResponse, CreateChatCompletionStreamResponse,
};

use super::{TryConvert, TryConvertStreamData, error::MapperError};

pub struct GoogleConverter;

impl GoogleConverter {
    #[must_use]
    pub fn new() -> Self {
        Self
    }
}

impl
    TryConvert<
        async_openai::types::CreateChatCompletionRequest,
        async_openai::types::CreateChatCompletionRequest,
    > for GoogleConverter
{
    type Error = MapperError;
    fn try_convert(
        &self,
        value: async_openai::types::CreateChatCompletionRequest,
    ) -> Result<async_openai::types::CreateChatCompletionRequest, Self::Error>
    {
        // no op:
        Ok(value)
    }
}

impl
    TryConvert<
        async_openai::types::CreateChatCompletionResponse,
        async_openai::types::CreateChatCompletionResponse,
    > for GoogleConverter
{
    type Error = MapperError;
    fn try_convert(
        &self,
        value: CreateChatCompletionResponse,
    ) -> Result<CreateChatCompletionResponse, Self::Error> {
        // no op:
        Ok(value)
    }
}

impl
    TryConvertStreamData<
        CreateChatCompletionStreamResponse,
        CreateChatCompletionStreamResponse,
    > for GoogleConverter
{
    type Error = MapperError;

    fn try_convert_chunk(
        &self,
        value: CreateChatCompletionStreamResponse,
    ) -> Result<Option<CreateChatCompletionStreamResponse>, Self::Error> {
        Ok(Some(value))
    }
}
