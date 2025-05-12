use std::{collections::HashMap, str::FromStr};

use anthropic_ai_sdk::types::message::ImageMediaType;

use super::{TryConvert, error::MapperError};
use crate::{
    endpoints::openai::chat_completions::system_prompt,
    middleware::mapper::model::ModelMapper,
    types::{model::Model, provider::InferenceProvider},
};

const DEFAULT_MAX_TOKENS: u32 = 1000;

pub struct ToAnthropicConverter {
    model_mapper: ModelMapper,
}

impl ToAnthropicConverter {
    #[must_use]
    pub fn new(model_mapper: ModelMapper) -> Self {
        Self { model_mapper }
    }
}

impl
    TryConvert<
        async_openai::types::CreateChatCompletionRequest,
        anthropic_ai_sdk::types::message::CreateMessageParams,
    > for ToAnthropicConverter
{
    type Error = MapperError;

    #[allow(clippy::too_many_lines)]
    fn try_convert(
        &self,
        value: async_openai::types::CreateChatCompletionRequest,
    ) -> std::result::Result<
        anthropic_ai_sdk::types::message::CreateMessageParams,
        Self::Error,
    > {
        use anthropic_ai_sdk::types::message as anthropic;
        use async_openai::types as openai;
        let target_provider = InferenceProvider::Anthropic;
        let source_model = Model::from_str(&value.model)?;
        let target_model = self
            .model_mapper
            .map_model(&target_provider, &source_model)?;
        tracing::trace!(source_model = ?source_model, target_model = ?target_model, "mapped model");
        let system_prompt = system_prompt(&value);
        #[allow(deprecated)]
        let max_tokens = value
            .max_completion_tokens
            .unwrap_or_else(|| value.max_tokens.unwrap_or(DEFAULT_MAX_TOKENS));
        let temperature = value.temperature;
        let stop_sequences = match value.stop {
            Some(openai::Stop::String(stop)) => Some(vec![stop]),
            Some(openai::Stop::StringArray(stops)) => Some(stops),
            None => None,
        };
        let stream = value.stream;
        let top_p = value.top_p;
        let tools = if let Some(tools) = value.tools {
            let mapped_tools: Vec<_> = tools
                .iter()
                .map(|tool| anthropic::Tool::Custom {
                    name: tool.function.name.clone(),
                    description: tool.function.description.clone(),
                    input_schema: tool
                        .function
                        .parameters
                        .clone()
                        .unwrap_or_default(),
                    cache_control: None,
                })
                .collect();
            Some(mapped_tools)
        } else {
            None
        };
        let metadata = value.user.map(|user| anthropic::Metadata {
            fields: HashMap::from([("user_id".to_string(), user)]),
        });

        let tool_choice = match value.tool_choice {
            Some(openai::ChatCompletionToolChoiceOption::Named(tool)) => {
                Some(anthropic::ToolChoice::Tool {
                    name: tool.function.name,
                    disable_parallel_tool_use: None,
                })
            }
            Some(openai::ChatCompletionToolChoiceOption::Auto) => {
                Some(anthropic::ToolChoice::Auto {
                    disable_parallel_tool_use: None,
                })
            }
            Some(openai::ChatCompletionToolChoiceOption::Required) => {
                Some(anthropic::ToolChoice::Any {
                    disable_parallel_tool_use: None,
                })
            }
            Some(openai::ChatCompletionToolChoiceOption::None) => {
                Some(anthropic::ToolChoice::None)
            }
            None => None,
        };

        let mut mapped_messages = Vec::with_capacity(value.messages.len());
        for message in value.messages {
            match message {
                // we've already set the system prompt
                openai::ChatCompletionRequestMessage::Developer(_)
                | openai::ChatCompletionRequestMessage::System(_) => {}
                openai::ChatCompletionRequestMessage::User(message) => {
                    let mapped_content = match message.content {
                        openai::ChatCompletionRequestUserMessageContent::Text(content) => {
                                    anthropic::MessageContent::Text { content }
                        },
                        openai::ChatCompletionRequestUserMessageContent::Array(content) => {
                            let mapped_content_blocks = content.into_iter().filter_map(|part| {
                                match part {
                                    openai::ChatCompletionRequestUserMessageContentPart::Text(text) => {
                                        Some(anthropic::ContentBlock::Text { text: text.text, citations: None })
                                    },
                                    openai::ChatCompletionRequestUserMessageContentPart::ImageUrl(image) => {
                                        let mapped_image = if image.image_url.url.starts_with("http") {
                                            anthropic::ImageSource::Url {
                                                url: image.image_url.url,
                                            }
                                        } else {
                                            anthropic::ImageSource::Base64 {
                                                media_type: ImageMediaType::Png,
                                                data: image.image_url.url,
                                            }
                                        };
                                        Some(anthropic::ContentBlock::Image { source: mapped_image })
                                    },
                                    openai::ChatCompletionRequestUserMessageContentPart::InputAudio(_audio) => {                                         // Anthropic API does not support audio
                                        // Anthropic does not support audio
                                        None
                                    },
                                }
                            }).collect();
                            anthropic::MessageContent::Blocks { content: mapped_content_blocks }
                        },
                    };
                    let mapped_message = anthropic::Message {
                        role: anthropic::Role::User,
                        content: mapped_content,
                    };
                    mapped_messages.push(mapped_message);
                }
                openai::ChatCompletionRequestMessage::Assistant(message) => {
                    let mapped_content = match message.content {
                        Some(openai::ChatCompletionRequestAssistantMessageContent::Text(content)) => {
                                    anthropic::MessageContent::Text { content }
                        },
                        Some(openai::ChatCompletionRequestAssistantMessageContent::Array(content)) => {
                            let mapped_content_blocks = content.into_iter().map(|part| {
                                match part {
                                    openai::ChatCompletionRequestAssistantMessageContentPart::Text(text) => {
                                        anthropic::ContentBlock::Text { text: text.text, citations: None }
                                    },
                                    openai::ChatCompletionRequestAssistantMessageContentPart::Refusal(text) => {
                                        anthropic::ContentBlock::Text { text: text.refusal.clone(), citations: None }
                                    },
                                }
                            }).collect();
                            anthropic::MessageContent::Blocks { content: mapped_content_blocks }
                        },
                        None => continue,
                    };
                    let mapped_message = anthropic::Message {
                        role: anthropic::Role::Assistant,
                        content: mapped_content,
                    };
                    mapped_messages.push(mapped_message);
                }
                openai::ChatCompletionRequestMessage::Tool(message) => {
                    let mapped_content = match message.content {
                        openai::ChatCompletionRequestToolMessageContent::Text(text) => {
                            let block = anthropic::ContentBlock::ToolResult {
                                tool_use_id: message.tool_call_id,
                                content: anthropic::ToolResultContent::TextContent(text),
                            };
                            anthropic::MessageContent::Blocks { content: vec![block] }
                        },
                        openai::ChatCompletionRequestToolMessageContent::Array(content) => {
                            let mapped_content_blocks = content.into_iter().map(|part| {
                                match part {
                                    openai::ChatCompletionRequestToolMessageContentPart::Text(text) => {
                                        anthropic::ContentBlock::ToolResult { tool_use_id: message.tool_call_id.clone(), content: anthropic::ToolResultContent::TextContent(text.text) }
                                    },
                                }
                            }).collect();
                            anthropic::MessageContent::Blocks { content: mapped_content_blocks }
                        },
                    };
                    let mapped_message = anthropic::Message {
                        role: anthropic::Role::Assistant,
                        content: mapped_content,
                    };
                    mapped_messages.push(mapped_message);
                }
                openai::ChatCompletionRequestMessage::Function(message) => {
                    let Some(tool) = tools.as_ref().and_then(|tools| {
                        tools
                            .iter()
                            .find(|tool| match tool {
                                anthropic::Tool::Custom { name, .. } => {
                                    *name == message.name
                                }
                                _ => false,
                            })
                            .cloned()
                    }) else {
                        continue;
                    };
                    let anthropic::Tool::Custom {
                        input_schema: input,
                        name,
                        ..
                    } = tool
                    else {
                        continue;
                    };
                    let mapped_content = anthropic::MessageContent::Blocks {
                        content: vec![anthropic::ContentBlock::ToolUse {
                            id: name.clone(),
                            name: name.clone(),
                            input: input.clone(),
                        }],
                    };
                    let mapped_message = anthropic::Message {
                        role: anthropic::Role::Assistant,
                        content: mapped_content,
                    };
                    mapped_messages.push(mapped_message);
                }
            }
        }

        Ok(anthropic::CreateMessageParams {
            max_tokens,
            messages: mapped_messages,
            model: target_model.as_ref().to_string(),
            system: system_prompt,
            temperature,
            stop_sequences,
            stream,
            top_k: None,
            top_p,
            tools,
            tool_choice,
            metadata,
            thinking: None,
        })
    }
}
