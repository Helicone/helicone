use super::{TryConvert, error::MapperError};
use crate::middleware::mapper::model::ModelMapper;

const DEFAULT_MAX_TOKENS: u32 = 1000;
const OPENAI_CHAT_COMPLETION_OBJECT: &str = "chat.completion";

pub struct GoogleConverter {
    model_mapper: ModelMapper,
}

impl GoogleConverter {
    #[must_use]
    pub fn new(model_mapper: ModelMapper) -> Self {
        Self { model_mapper }
    }
}

impl
    TryConvert<
        async_openai::types::CreateChatCompletionRequest,
        async_openai::types::CreateChatCompletionRequest,
    > for GoogleConverter
{
    type Error = MapperError;
    #[allow(clippy::too_many_lines)]
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
    #[allow(clippy::too_many_lines)]
    fn try_convert(
        &self,
        value: async_openai::types::CreateChatCompletionResponse,
    ) -> Result<async_openai::types::CreateChatCompletionResponse, Self::Error>
    {
        // no op:
        Ok(value)
    }
}
