use async_openai::types::{
    ChatCompletionRequestDeveloperMessageContent, ChatCompletionRequestMessage,
    ChatCompletionRequestSystemMessageContent,
    ChatCompletionRequestSystemMessageContentPart, CreateChatCompletionRequest,
    CreateChatCompletionResponse,
};

use crate::endpoints::Endpoint;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ChatCompletions;

impl Endpoint for ChatCompletions {
    const PATH: &'static str = "/v1/chat/completions";
    type RequestBody = CreateChatCompletionRequest;
    type ResponseBody = CreateChatCompletionResponse;
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
