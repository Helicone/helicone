use std::{collections::HashMap, str::FromStr};

use super::{TryConvert, TryConvertStreamData};
use crate::{
    endpoints::openai::chat_completions::system_prompt,
    error::mapper::MapperError,
    middleware::mapper::{DEFAULT_MAX_TOKENS, model::ModelMapper},
    types::{
        model_id::{ModelId, Version},
        provider::InferenceProvider,
    },
};

pub const OPENAI_CHAT_COMPLETION_OBJECT: &str = "chat.completion";

pub struct AnthropicConverter {
    model_mapper: ModelMapper,
}

impl AnthropicConverter {
    #[must_use]
    pub fn new(model_mapper: ModelMapper) -> Self {
        Self { model_mapper }
    }
}

impl
    TryConvert<
        async_openai::types::CreateChatCompletionRequest,
        anthropic_ai_sdk::types::message::CreateMessageParams,
    > for AnthropicConverter
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
        let source_model = ModelId::from_str(&value.model)?;
        let mut target_model = self
            .model_mapper
            .map_model(&source_model, &target_provider)?;
        tracing::trace!(source_model = ?source_model, target_model = ?target_model, "mapped model");

        // for claude 3-x, anthropic required an explicit `-latest` suffix for
        // aliases but for claude 4-x, the aliases must be implicit, ie they
        // must not have the `-latest` suffix

        if let ModelId::Anthropic(model) = &mut target_model {
            if model.model.contains("claude-3") {
                model.version = Version::Latest;
            } else {
                model.version = Version::ImplicitLatest;
            }
        }

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
                .map(|tool| anthropic::Tool {
                    name: tool.function.name.clone(),
                    description: tool.function.description.clone(),
                    input_schema: tool
                        .function
                        .parameters
                        .clone()
                        .unwrap_or_default(),
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
                })
            }
            Some(openai::ChatCompletionToolChoiceOption::Auto) => {
                Some(anthropic::ToolChoice::Auto)
            }
            Some(openai::ChatCompletionToolChoiceOption::Required) => {
                Some(anthropic::ToolChoice::Any)
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
                                        Some(anthropic::ContentBlock::Text { text: text.text })
                                    },
                                    openai::ChatCompletionRequestUserMessageContentPart::ImageUrl(image) => {
                                        let mapped_image = if image.image_url.url.starts_with("http") {
                                            anthropic::ImageSource {
                                                type_: "url".to_string(),
                                                media_type: String::new(),
                                                data: image.image_url.url,
                                            }
                                        } else {
                                            anthropic::ImageSource {
                                                type_: "base64".to_string(),
                                                media_type: "image/png".to_string(),
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
                                        anthropic::ContentBlock::Text { text: text.text }
                                    },
                                    openai::ChatCompletionRequestAssistantMessageContentPart::Refusal(text) => {
                                        anthropic::ContentBlock::Text { text: text.refusal.clone() }
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
                        openai::ChatCompletionRequestToolMessageContent::Text(content) => {
                            let block = anthropic::ContentBlock::ToolResult {
                                tool_use_id: message.tool_call_id,
                                content,
                            };
                            anthropic::MessageContent::Blocks { content: vec![block] }
                        },
                        openai::ChatCompletionRequestToolMessageContent::Array(content) => {
                            let mapped_content_blocks = content.into_iter().map(|part| {
                                match part {
                                    openai::ChatCompletionRequestToolMessageContentPart::Text(text) => {
                                        anthropic::ContentBlock::ToolResult { tool_use_id: message.tool_call_id.clone(), content: text.text }
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
                        tools.iter().find(|tool| tool.name == message.name)
                    }) else {
                        continue;
                    };
                    let mapped_content = anthropic::MessageContent::Blocks {
                        content: vec![anthropic::ContentBlock::ToolUse {
                            id: message.name.clone(),
                            name: tool.name.clone(),
                            input: tool.input_schema.clone(),
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
            model: target_model.to_string(),
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

impl
    TryConvert<
        anthropic_ai_sdk::types::message::CreateMessageResponse,
        async_openai::types::CreateChatCompletionResponse,
    > for AnthropicConverter
{
    type Error = MapperError;

    #[allow(clippy::too_many_lines)]
    fn try_convert(
        &self,
        value: anthropic_ai_sdk::types::message::CreateMessageResponse,
    ) -> std::result::Result<
        async_openai::types::CreateChatCompletionResponse,
        Self::Error,
    > {
        use anthropic_ai_sdk::types::message as anthropic;
        use async_openai::types as openai;
        let id = value.id;
        let model = value.model;

        let created = 0;
        let object = OPENAI_CHAT_COMPLETION_OBJECT.to_string();

        let usage = openai::CompletionUsage {
            prompt_tokens: value.usage.input_tokens,
            completion_tokens: value.usage.output_tokens,
            total_tokens: value.usage.input_tokens + value.usage.output_tokens,
            prompt_tokens_details: None,
            completion_tokens_details: None,
        };

        let mut tool_calls: Vec<openai::ChatCompletionMessageToolCall> =
            Vec::new();
        let mut content = None;
        for anthropic_content in value.content {
            match anthropic_content {
                anthropic::ContentBlock::ToolUse { id, name, input } => {
                    tool_calls.push(openai::ChatCompletionMessageToolCall {
                        id: id.clone(),
                        r#type: openai::ChatCompletionToolType::Function,
                        function: openai::FunctionCall {
                            name: name.clone(),
                            arguments: serde_json::to_string(&input)?,
                        },
                    });
                }
                anthropic::ContentBlock::ToolResult {
                    tool_use_id,
                    content,
                } => tool_calls.push(openai::ChatCompletionMessageToolCall {
                    id: tool_use_id.clone(),
                    r#type: openai::ChatCompletionToolType::Function,
                    function: openai::FunctionCall {
                        name: tool_use_id.clone(),
                        arguments: serde_json::to_string(&content)?,
                    },
                }),

                anthropic::ContentBlock::Text { text, .. } => {
                    content = Some(text.clone());
                }
                anthropic::ContentBlock::Image { .. }
                | anthropic::ContentBlock::Thinking { .. }
                | anthropic::ContentBlock::RedactedThinking { .. } => {}
            }
        }
        let tool_calls = if tool_calls.is_empty() {
            None
        } else {
            Some(tool_calls)
        };

        #[allow(deprecated)]
        let message = openai::ChatCompletionResponseMessage {
            content,
            refusal: None,
            tool_calls,
            role: openai::Role::Assistant,
            function_call: None,
            audio: None,
        };

        let choice = openai::ChatChoice {
            index: 0,
            message,
            finish_reason: None,
            logprobs: None,
        };

        let response = openai::CreateChatCompletionResponse {
            choices: vec![choice],
            id,
            created,
            model,
            object,
            usage: Some(usage),
            service_tier: None,
            system_fingerprint: None,
        };
        Ok(response)
    }
}

impl
    TryConvertStreamData<
        anthropic_ai_sdk::types::message::StreamEvent,
        async_openai::types::CreateChatCompletionStreamResponse,
    > for AnthropicConverter
{
    type Error = MapperError;

    #[allow(clippy::too_many_lines)]
    fn try_convert_chunk(
        &self,
        value: anthropic_ai_sdk::types::message::StreamEvent,
    ) -> std::result::Result<
        Option<async_openai::types::CreateChatCompletionStreamResponse>,
        Self::Error,
    > {
        use anthropic_ai_sdk::types::message as anthropic;
        use async_openai::types as openai;

        const CHAT_COMPLETION_CHUNK_OBJECT: &str = "chat.completion.chunk";
        // TODO: These placeholder values for id, model, and created should be
        // replaced by actual values from the MessageStart event,
        // propagated by the stream handling logic.
        const PLACEHOLDER_STREAM_ID: &str = "anthropic-stream-id";
        const PLACEHOLDER_MODEL_NAME: &str = "anthropic-model";
        const DEFAULT_CREATED_TIMESTAMP: u32 = 0;

        #[allow(deprecated)]
        match value {
            anthropic::StreamEvent::MessageStart { message } => {
                let mut current_text_content = String::new();
                let mut tool_calls = Vec::new();

                for (idx, content_block) in message.content.iter().enumerate() {
                    match content_block {
                        anthropic::ContentBlock::Text { text, .. } => {
                            current_text_content.push_str(text);
                        }
                        anthropic::ContentBlock::ToolUse {
                            id,
                            name,
                            input,
                        } => {
                            tool_calls.push(
                                openai::ChatCompletionMessageToolCallChunk {
                                    index: u32::try_from(idx).unwrap_or(0),
                                    id: Some(id.clone()),
                                    r#type: Some(openai::ChatCompletionToolType::Function),
                                    function: Some(openai::FunctionCallStream {
                                        name: Some(name.clone()),
                                        arguments: Some(
                                            serde_json::to_string(input)
                                                .map_err(MapperError::SerdeError)?,
                                        ),
                                    }),
                                }
                            );
                        }
                        anthropic::ContentBlock::ToolResult {
                            tool_use_id: _,
                            content,
                        } => {
                            current_text_content.push('\n');
                            current_text_content.push_str(content);
                        }
                        _ => {}
                    }
                }

                let finish_reason = match message.stop_reason {
                    Some(
                        anthropic::StopReason::EndTurn
                        | anthropic::StopReason::StopSequence,
                    ) => Some(openai::FinishReason::Stop),
                    Some(anthropic::StopReason::MaxTokens) => {
                        Some(openai::FinishReason::Length)
                    }
                    Some(anthropic::StopReason::ToolUse) => {
                        Some(openai::FinishReason::ToolCalls)
                    }
                    Some(anthropic::StopReason::Refusal) => {
                        Some(openai::FinishReason::ContentFilter)
                    }
                    None => None,
                };

                let refusal_content = if matches!(
                    message.stop_reason,
                    Some(anthropic::StopReason::Refusal)
                ) {
                    message.stop_sequence.clone() // stop_sequence is Option<String>
                } else {
                    None
                };

                let choice = openai::ChatChoiceStream {
                    index: 0,
                    delta: openai::ChatCompletionStreamResponseDelta {
                        role: Some(match message.role {
                            anthropic::Role::User => openai::Role::User,
                            anthropic::Role::Assistant => {
                                openai::Role::Assistant
                            }
                        }),
                        content: Some(current_text_content),
                        tool_calls: Some(tool_calls),
                        refusal: refusal_content,
                        function_call: None,
                    },
                    finish_reason,
                    logprobs: None,
                };
                Ok(Some(openai::CreateChatCompletionStreamResponse {
                    id: message.id,
                    choices: vec![choice],
                    created: DEFAULT_CREATED_TIMESTAMP, /* Or use message.
                                                         * usage if there's a
                                                         * timestamp */
                    model: message.model,
                    object: CHAT_COMPLETION_CHUNK_OBJECT.to_string(),
                    system_fingerprint: None,
                    service_tier: None,
                    usage: Some(openai::CompletionUsage {
                        // Anthropic provides full usage at MessageStart
                        prompt_tokens: message.usage.input_tokens,
                        completion_tokens: message.usage.output_tokens,
                        total_tokens: message.usage.input_tokens
                            + message.usage.output_tokens,
                        prompt_tokens_details: None,
                        completion_tokens_details: None,
                    }),
                }))
            }
            anthropic::StreamEvent::ContentBlockStart {
                index,
                content_block,
            } => {
                match content_block {
                    anthropic::ContentBlock::ToolUse { id, name, input } => {
                        let tool_call_chunk =
                            openai::ChatCompletionMessageToolCallChunk {
                                index: u32::try_from(index).unwrap_or(0),
                                id: Some(id),
                                r#type: Some(
                                    openai::ChatCompletionToolType::Function,
                                ),
                                function: Some(openai::FunctionCallStream {
                                    name: Some(name),
                                    arguments: Some(
                                        serde_json::to_string(&input)
                                            .map_err(MapperError::SerdeError)?,
                                    ),
                                }),
                            };
                        let choice = openai::ChatChoiceStream {
                            index: 0,
                            delta: openai::ChatCompletionStreamResponseDelta {
                                role: None,
                                content: None,
                                tool_calls: Some(vec![tool_call_chunk]),
                                refusal: None,
                                function_call: None,
                            },
                            finish_reason: None,
                            logprobs: None,
                        };
                        Ok(Some(openai::CreateChatCompletionStreamResponse {
                            id: PLACEHOLDER_STREAM_ID.to_string(), /* TODO: Use actual stream ID */
                            choices: vec![choice],
                            created: DEFAULT_CREATED_TIMESTAMP,
                            model: PLACEHOLDER_MODEL_NAME.to_string(),
                            object: CHAT_COMPLETION_CHUNK_OBJECT.to_string(),
                            system_fingerprint: None,
                            service_tier: None,
                            usage: None,
                        }))
                    }
                    _ => Ok(None), // Text start, etc., content comes in delta
                }
            }
            anthropic::StreamEvent::ContentBlockDelta { index, delta } => {
                match delta {
                    anthropic::ContentBlockDelta::TextDelta { text } => {
                        let choice = openai::ChatChoiceStream {
                            index: u32::try_from(index).unwrap_or(0),
                            delta: openai::ChatCompletionStreamResponseDelta {
                                role: None,
                                content: Some(text),
                                tool_calls: None,
                                refusal: None,
                                function_call: None,
                            },
                            finish_reason: None,
                            logprobs: None,
                        };
                        Ok(Some(openai::CreateChatCompletionStreamResponse {
                            id: PLACEHOLDER_STREAM_ID.to_string(), /* TODO: Use actual stream ID */
                            choices: vec![choice],
                            created: DEFAULT_CREATED_TIMESTAMP, /* TODO: Use actual created timestamp */
                            model: PLACEHOLDER_MODEL_NAME.to_string(), /* TODO: Use actual model name */
                            object: CHAT_COMPLETION_CHUNK_OBJECT.to_string(),
                            system_fingerprint: None,
                            service_tier: None,
                            usage: None,
                        }))
                    }
                    anthropic::ContentBlockDelta::InputJsonDelta {
                        partial_json,
                    } => {
                        let tool_call_chunk =
                            openai::ChatCompletionMessageToolCallChunk {
                                index: u32::try_from(index).unwrap_or(0),
                                id: None, /* ID would have been sent with ContentBlockStart for this tool */
                                r#type: Some(
                                    openai::ChatCompletionToolType::Function,
                                ), // Assuming function
                                function: Some(openai::FunctionCallStream {
                                    name: None, /* Name would have been sent
                                                 * with ContentBlockStart */
                                    arguments: Some(partial_json),
                                }),
                            };
                        let choice = openai::ChatChoiceStream {
                            index: u32::try_from(index).unwrap_or(0),
                            delta: openai::ChatCompletionStreamResponseDelta {
                                role: None,
                                content: None,
                                tool_calls: Some(vec![tool_call_chunk]),
                                refusal: None,
                                function_call: None,
                            },
                            finish_reason: None,
                            logprobs: None,
                        };
                        Ok(Some(openai::CreateChatCompletionStreamResponse {
                            id: PLACEHOLDER_STREAM_ID.to_string(), /* TODO: Use actual stream ID */
                            choices: vec![choice],
                            created: DEFAULT_CREATED_TIMESTAMP, /* TODO: Use actual created timestamp */
                            model: PLACEHOLDER_MODEL_NAME.to_string(), /* TODO: Use actual model name */
                            object: CHAT_COMPLETION_CHUNK_OBJECT.to_string(),
                            system_fingerprint: None,
                            service_tier: None,
                            usage: None,
                        }))
                    }
                    anthropic::ContentBlockDelta::ThinkingDelta { .. }
                    | anthropic::ContentBlockDelta::SignatureDelta { .. } => {
                        Ok(None)
                    } // No direct OpenAI mapping for these deltas
                }
            }
            anthropic::StreamEvent::ContentBlockStop { index: _ }
            | anthropic::StreamEvent::MessageStop
            | anthropic::StreamEvent::Ping => Ok(None), /* Usually no */
            // separate OpenAI
            // chunk for this
            anthropic::StreamEvent::MessageDelta { delta, usage } => {
                let finish_reason = match delta.stop_reason {
                    Some(
                        anthropic::StopReason::EndTurn
                        | anthropic::StopReason::StopSequence,
                    ) => Some(openai::FinishReason::Stop),
                    Some(anthropic::StopReason::MaxTokens) => {
                        Some(openai::FinishReason::Length)
                    }
                    Some(anthropic::StopReason::ToolUse) => {
                        Some(openai::FinishReason::ToolCalls)
                    }
                    Some(anthropic::StopReason::Refusal) => {
                        Some(openai::FinishReason::ContentFilter)
                    }
                    None => None,
                };

                let completion_usage = openai::CompletionUsage {
                    prompt_tokens: usage.as_ref().map_or(0, |u| u.input_tokens),
                    completion_tokens: usage
                        .as_ref()
                        .map_or(0, |u| u.output_tokens),
                    total_tokens: usage
                        .as_ref()
                        .map_or(0, |u| u.input_tokens + u.output_tokens),
                    prompt_tokens_details: None,
                    completion_tokens_details: None,
                };

                let choice = openai::ChatChoiceStream {
                    index: 0,
                    delta: openai::ChatCompletionStreamResponseDelta {
                        role: None,
                        content: None,
                        tool_calls: None,
                        refusal: delta.stop_sequence, /* Or map to a specific
                                                       * refusal field if
                                                       * applicable */
                        function_call: None,
                    },
                    finish_reason,
                    logprobs: None,
                };
                Ok(Some(openai::CreateChatCompletionStreamResponse {
                    id: PLACEHOLDER_STREAM_ID.to_string(), /* TODO: Use actual stream ID */
                    choices: vec![choice],
                    created: DEFAULT_CREATED_TIMESTAMP, /* TODO: Use actual created timestamp */
                    model: PLACEHOLDER_MODEL_NAME.to_string(), /* TODO: Use actual model name */
                    object: CHAT_COMPLETION_CHUNK_OBJECT.to_string(),
                    system_fingerprint: None,
                    service_tier: None,
                    usage: Some(completion_usage),
                }))
            }
            anthropic::StreamEvent::Error { error } => {
                tracing::warn!(error = ?error, "error in stream event");
                Err(MapperError::StreamError(format!(
                    "type: {}, message: {}",
                    error.type_, error.message
                )))
            }
        }
    }
}

impl
    TryConvert<
        anthropic_ai_sdk::types::message::CreateMessageParams,
        anthropic_ai_sdk::types::message::CreateMessageParams,
    > for AnthropicConverter
{
    type Error = MapperError;
    fn try_convert(
        &self,
        mut value: anthropic_ai_sdk::types::message::CreateMessageParams,
    ) -> Result<
        anthropic_ai_sdk::types::message::CreateMessageParams,
        Self::Error,
    > {
        let source_model = ModelId::from_str(&value.model)?;
        let target_model = self
            .model_mapper
            .map_model(&source_model, &InferenceProvider::Anthropic)?;
        tracing::trace!(source_model = ?source_model, target_model = ?target_model, "mapped model");

        value.model = target_model.to_string();

        Ok(value)
    }
}

impl
    TryConvert<
        anthropic_ai_sdk::types::message::CreateMessageResponse,
        anthropic_ai_sdk::types::message::CreateMessageResponse,
    > for AnthropicConverter
{
    type Error = MapperError;
    fn try_convert(
        &self,
        value: anthropic_ai_sdk::types::message::CreateMessageResponse,
    ) -> Result<
        anthropic_ai_sdk::types::message::CreateMessageResponse,
        Self::Error,
    > {
        Ok(value)
    }
}

impl
    TryConvertStreamData<
        anthropic_ai_sdk::types::message::StreamEvent,
        anthropic_ai_sdk::types::message::StreamEvent,
    > for AnthropicConverter
{
    type Error = MapperError;

    fn try_convert_chunk(
        &self,
        value: anthropic_ai_sdk::types::message::StreamEvent,
    ) -> Result<
        Option<anthropic_ai_sdk::types::message::StreamEvent>,
        Self::Error,
    > {
        Ok(Some(value))
    }
}
