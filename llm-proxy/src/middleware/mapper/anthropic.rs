use super::{Convert, TryConvert, error::MapperError};
use crate::{
    config::model_mapping::ModelMappingConfig, types::provider::Provider,
};

pub struct AnthropicConverter<'a> {
    model_mappings: &'a ModelMappingConfig,
}

impl<'a> AnthropicConverter<'a> {
    pub fn new(model_mappings: &'a ModelMappingConfig) -> Self {
        Self { model_mappings }
    }
}

impl Convert<anthropic_types::chat::Role> for openai_types::chat::Role {
    fn convert(value: anthropic_types::chat::Role) -> Self {
        match value {
            anthropic_types::chat::Role::System => Self::System,
            anthropic_types::chat::Role::User => Self::User,
            anthropic_types::chat::Role::Assistant => Self::Assistant,
            anthropic_types::chat::Role::Developer => Self::Developer,
        }
    }
}

impl<'a>
    TryConvert<
        anthropic_types::chat::ChatCompletionRequest,
        openai_types::chat::ChatCompletionRequest,
    > for AnthropicConverter<'a>
{
    type Error = MapperError;

    fn try_convert(
        &self,
        value: anthropic_types::chat::ChatCompletionRequest,
    ) -> std::result::Result<
        openai_types::chat::ChatCompletionRequest,
        Self::Error,
    > {
        let target_provider = Provider::OpenAI;
        // TODO: would be nice to remove the clone in the .get() call here
        let model = self
            .model_mappings
            .as_ref()
            .get(&(target_provider, value.model.clone()))
            .ok_or_else(|| {
                MapperError::NoModelMapping(
                    target_provider,
                    value.model.clone(),
                )
            })?
            .clone();
        let mut messages = Vec::with_capacity(value.messages.len());
        if let Some(system_prompt) = value.system {
            messages.push(openai_types::chat::ChatCompletionRequestMessage {
                role: openai_types::chat::Role::System,
                content: system_prompt,
            });
        }
        for message in value.messages {
            messages.push(openai_types::chat::ChatCompletionRequestMessage {
                role: openai_types::chat::Role::convert(message.role),
                content: message.content,
            });
        }
        Ok(openai_types::chat::ChatCompletionRequest {
            messages,
            model,
            temperature: value.temperature,
            max_tokens: Some(value.max_tokens),
        })
    }
}
