use std::str::FromStr;

use crate::{
    config::model_mapping::ModelMapper,
    middleware::mapper::{Convert, TryConvert, error::MapperError},
    types::{model::Model, provider::Provider},
};

pub struct OpenAiConverter<'a> {
    model_mapper: &'a ModelMapper,
}

impl<'a> OpenAiConverter<'a> {
    pub fn new(model_mapper: &'a ModelMapper) -> Self {
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
        let mut source_model = Model::from_str(&value.model)?;
        // atm, we don't care about the version of the model when mapping
        // between providers
        source_model.version = None;
        let model = self
            .model_mapper
            .get(&target_provider, &source_model)
            .ok_or_else(|| {
                MapperError::NoModelMapping(
                    target_provider,
                    source_model.name.clone(),
                )
            })?;
        tracing::debug!(source_model = ?value.model, target_model = ?model, source_provider = %Provider::OpenAI, target_provider = %Provider::Anthropic, "mapped model");
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
            model: model.name,
            temperature: value.temperature,
            max_tokens: value.max_tokens.unwrap_or(u32::MAX),
            system,
        })
    }
}
