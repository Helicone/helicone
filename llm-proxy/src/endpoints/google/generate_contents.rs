use async_openai::types::{
    CreateChatCompletionRequest, CreateChatCompletionResponse,
    CreateChatCompletionStreamResponse,
};
use serde::{Deserialize, Serialize};

use crate::{
    endpoints::AiRequest,
    middleware::mapper::error::MapperError,
    types::{model_id::ModelId, provider::InferenceProvider},
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub struct GenerateContents;

impl crate::endpoints::Endpoint for GenerateContents {
    // https://ai.google.dev/gemini-api/docs/openai
    const PATH: &'static str = "/v1beta/openai/chat/completions";
    type RequestBody = CreateChatCompletionRequestGemini;
    type ResponseBody = CreateChatCompletionResponse;
    type StreamResponseBody = CreateChatCompletionStreamResponse;
}

#[derive(Clone, Serialize, Default, Debug, Deserialize, PartialEq)]
pub struct CreateChatCompletionRequestGemini(
    pub(crate) CreateChatCompletionRequest,
);

impl AiRequest for CreateChatCompletionRequestGemini {
    fn is_stream(&self) -> bool {
        self.0.stream.unwrap_or(false)
    }

    fn model(&self) -> Result<ModelId, MapperError> {
        ModelId::from_str_and_provider(
            InferenceProvider::GoogleGemini,
            &self.0.model,
        )
    }
}
