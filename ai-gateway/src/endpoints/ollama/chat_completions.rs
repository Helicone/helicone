use async_openai::types::{
    CreateChatCompletionRequest, CreateChatCompletionResponse,
    CreateChatCompletionStreamResponse,
};
use serde::{Deserialize, Serialize};

use crate::{
    endpoints::AiRequest,
    error::mapper::MapperError,
    types::{model_id::ModelId, provider::InferenceProvider},
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub struct ChatCompletions;

impl crate::endpoints::Endpoint for ChatCompletions {
    // https://ollama.com/blog/openai-compatibility
    const PATH: &'static str = "/v1/chat/completions";
    type RequestBody = CreateChatCompletionRequestOllama;
    type ResponseBody = CreateChatCompletionResponse;
    type StreamResponseBody = CreateChatCompletionStreamResponse;
}

#[derive(Clone, Serialize, Default, Debug, Deserialize, PartialEq)]
pub struct CreateChatCompletionRequestOllama(
    pub(crate) CreateChatCompletionRequest,
);

impl AiRequest for CreateChatCompletionRequestOllama {
    fn is_stream(&self) -> bool {
        self.0.stream.unwrap_or(false)
    }

    fn model(&self) -> Result<ModelId, MapperError> {
        ModelId::from_str_and_provider(InferenceProvider::Ollama, &self.0.model)
    }
}
