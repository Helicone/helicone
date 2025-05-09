use std::str::FromStr;

use crate::{
    config::model_mapping::ModelMapper,
    middleware::mapper::{Convert, TryConvert, error::MapperError},
    types::{model::Model, provider::InferenceProvider},
};

pub struct OpenAiConverter<'a> {
    model_mapper: &'a ModelMapper<'a>,
}

impl<'a> OpenAiConverter<'a> {
    #[must_use]
    pub fn new(model_mapper: &'a ModelMapper<'a>) -> Self {
        Self { model_mapper }
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

impl
    TryConvert<
        openai_types::chat::ChatCompletionRequest,
        anthropic_types::chat::ChatCompletionRequest,
    > for OpenAiConverter<'_>
{
    type Error = MapperError;

    fn try_convert(
        &self,
        value: openai_types::chat::ChatCompletionRequest,
    ) -> std::result::Result<
        anthropic_types::chat::ChatCompletionRequest,
        Self::Error,
    > {
        let target_provider = InferenceProvider::Anthropic;
        let source_model = Model::from_str(&value.model)?;
        let model = self.model_mapper.get(&target_provider, &source_model)?;
        tracing::trace!(source_model = ?source_model, target_model = ?model, "mapped model");
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
            model: model.as_ref().to_string(),
            temperature: value.temperature,
            max_tokens: value.max_tokens.unwrap_or(u32::MAX),
            system,
        })
    }
}
