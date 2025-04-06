use crate::mapper::{Convert, TryConvert, error::MapperError};

impl Convert<openai_types::chat::Role> for anthropic_types::chat::Role {
    fn convert(value: openai_types::chat::Role) -> Self {
        match value {
            openai_types::chat::Role::System => Self::System,
            openai_types::chat::Role::User => Self::User,
            openai_types::chat::Role::Assistant => Self::Assistant,
            openai_types::chat::Role::Developer => Self::Developer,
        }
    }
}

impl TryConvert<openai_types::chat::ChatCompletionRequest>
    for anthropic_types::chat::ChatCompletionRequest
{
    type Error = MapperError;

    fn try_convert(
        value: openai_types::chat::ChatCompletionRequest,
    ) -> std::result::Result<Self, Self::Error> {
        let system = if let Some(message) = value.messages.first() {
            if message.role == openai_types::chat::Role::System {
                Some(message.content.clone())
            } else {
                None
            }
        } else {
            None
        };
        let mut messages = Vec::with_capacity(value.messages.len());
        for message in value.messages {
            match message.role {
                openai_types::chat::Role::System
                | openai_types::chat::Role::Developer => {
                    continue;
                }
                _ => {}
            }
            messages.push(
                anthropic_types::chat::ChatCompletionRequestMessage {
                    role: anthropic_types::chat::Role::convert(message.role),
                    content: message.content.clone(),
                },
            );
        }
        Ok(Self {
            messages,
            model: String::from("claude-3-7-sonnet-latest"),
            temperature: value.temperature,
            max_tokens: value.max_tokens.unwrap_or(u32::MAX),
            system,
        })
    }
}
