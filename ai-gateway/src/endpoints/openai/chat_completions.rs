use async_openai::types::{
    ChatCompletionRequestDeveloperMessageContent, ChatCompletionRequestMessage,
    ChatCompletionRequestSystemMessageContent,
    ChatCompletionRequestSystemMessageContentPart, CreateChatCompletionRequest,
    CreateChatCompletionResponse, CreateChatCompletionStreamResponse,
};

use crate::{
    endpoints::{AiRequest, Endpoint},
    error::mapper::MapperError,
    types::{model_id::ModelId, provider::InferenceProvider},
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub struct ChatCompletions;

impl Endpoint for ChatCompletions {
    const PATH: &'static str = "/v1/chat/completions";
    type RequestBody = CreateChatCompletionRequest;
    type ResponseBody = CreateChatCompletionResponse;
    type StreamResponseBody = CreateChatCompletionStreamResponse;
}

impl AiRequest for CreateChatCompletionRequest {
    fn is_stream(&self) -> bool {
        self.stream.unwrap_or(false)
    }

    fn model(&self) -> Result<ModelId, MapperError> {
        ModelId::from_str_and_provider(InferenceProvider::OpenAI, &self.model)
    }
}

pub(crate) fn system_prompt(
    request: &CreateChatCompletionRequest,
) -> Option<String> {
    if let Some(message) = request.messages.first() {
        match message {
            ChatCompletionRequestMessage::Developer(message) => {
                match &message.content {
                    ChatCompletionRequestDeveloperMessageContent::Text(
                        content,
                    ) => Some(content.clone()),
                    ChatCompletionRequestDeveloperMessageContent::Array(
                        content,
                    ) => {
                        let content = content
                            .iter()
                            .map(|part| part.text.as_str())
                            .collect::<Vec<&str>>()
                            .join("\n");
                        Some(content)
                    }
                }
            }
            ChatCompletionRequestMessage::System(message) => {
                match &message.content {
                    ChatCompletionRequestSystemMessageContent::Text(
                        content,
                    ) => Some(content.clone()),
                    ChatCompletionRequestSystemMessageContent::Array(
                        content,
                    ) => {
                        let content = content.iter().map(|part| {
                            match part {
                                ChatCompletionRequestSystemMessageContentPart::Text(txt) => txt.text.as_str(),
                            }
                        }).collect::<Vec<&str>>().join("\n");
                        Some(content)
                    }
                }
            }
            ChatCompletionRequestMessage::User(_)
            | ChatCompletionRequestMessage::Assistant(_)
            | ChatCompletionRequestMessage::Tool(_)
            | ChatCompletionRequestMessage::Function(_) => None,
        }
    } else {
        None
    }
}
