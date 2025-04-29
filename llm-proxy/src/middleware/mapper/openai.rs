use crate::{
    config::model_mapping::ModelMappingConfig,
    middleware::mapper::{Convert, TryConvert, error::MapperError},
    types::provider::Provider,
};

pub struct OpenAiConverter<'a> {
    model_mappings: &'a ModelMappingConfig,
}

impl<'a> OpenAiConverter<'a> {
    pub fn new(model_mappings: &'a ModelMappingConfig) -> Self {
        Self { model_mappings }
    }
}

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

impl<'a>
    TryConvert<
        openai_types::chat::ChatCompletionRequest,
        anthropic_types::chat::ChatCompletionRequest,
    > for OpenAiConverter<'a>
{
    type Error = MapperError;

    fn try_convert(
        &self,
        value: openai_types::chat::ChatCompletionRequest,
    ) -> std::result::Result<
        anthropic_types::chat::ChatCompletionRequest,
        Self::Error,
    > {
        let target_provider = Provider::Anthropic;
        let model = self
            .model_mappings
            .as_ref()
            .get(&target_provider)
            .and_then(|m| m.get(&value.model))
            .ok_or_else(|| {
                MapperError::NoModelMapping(
                    target_provider,
                    value.model.clone(),
                )
            })?
            .clone();
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
        Ok(anthropic_types::chat::ChatCompletionRequest {
            messages,
            model,
            temperature: value.temperature,
            max_tokens: value.max_tokens.unwrap_or(u32::MAX),
            system,
        })
    }
}
