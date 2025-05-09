use std::str::FromStr;

use super::{Convert, TryConvert, error::MapperError};
use crate::{
    config::model_mapping::ModelMapper,
    types::{model::Model, provider::InferenceProvider},
};

pub struct AnthropicConverter<'a> {
    model_mapper: &'a ModelMapper<'a>,
}

impl<'a> AnthropicConverter<'a> {
    #[must_use]
    pub fn new(model_mapper: &'a ModelMapper<'a>) -> Self {
        Self { model_mapper }
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

impl
    TryConvert<
        anthropic_types::chat::ChatCompletionRequest,
        openai_types::chat::ChatCompletionRequest,
    > for AnthropicConverter<'_>
{
    type Error = MapperError;

    fn try_convert(
        &self,
        value: anthropic_types::chat::ChatCompletionRequest,
    ) -> std::result::Result<
        openai_types::chat::ChatCompletionRequest,
        Self::Error,
    > {
        let target_provider = InferenceProvider::OpenAI;
        let source_model = Model::from_str(&value.model)?;
        let model = self.model_mapper.get(&target_provider, &source_model)?;

        tracing::trace!(source_model = ?source_model, target_model = ?model, "mapped model");
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
            model: model.as_ref().to_string(),
            temperature: value.temperature,
            max_tokens: Some(value.max_tokens),
        })
    }
}
