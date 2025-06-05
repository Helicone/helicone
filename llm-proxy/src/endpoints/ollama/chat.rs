use ollama_rest::models::chat::{ChatRequest, ChatResponse};

use crate::{
    endpoints::{AiRequest, Endpoint},
    middleware::mapper::error::MapperError,
    types::{model_id::ModelId, provider::InferenceProvider},
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub struct Chat;

impl Endpoint for Chat {
    const PATH: &'static str = "/api/chat";
    type RequestBody = ChatRequest;
    type ResponseBody = ChatResponse;
    type StreamResponseBody = ChatResponse;
}

impl AiRequest for ChatRequest {
    fn is_stream(&self) -> bool {
        self.stream.unwrap_or(false)
    }

    fn model(&self) -> Result<ModelId, MapperError> {
        ModelId::from_str_and_provider(InferenceProvider::Ollama, &self.model)
    }
}
