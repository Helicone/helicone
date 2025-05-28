use std::{collections::HashMap, str::FromStr};

use anthropic_ai_sdk::types::message::ImageMediaType;

use super::{TryConvert, TryConvertStreamData, error::MapperError, google};
use crate::{
    endpoints::openai::chat_completions::system_prompt,
    middleware::mapper::model::ModelMapper,
    types::{model::Model, provider::InferenceProvider},
};

const DEFAULT_MAX_TOKENS: u32 = 1000;
const OPENAI_CHAT_COMPLETION_OBJECT: &str = "chat.completion";

pub struct GoogleConverter {
    model_mapper: ModelMapper,
}

impl GoogleConverter {
    #[must_use]
    pub fn new(model_mapper: ModelMapper) -> Self {
        Self { model_mapper }
    }
}

impl
    TryConvert<
        async_openai::types::CreateChatCompletionRequest,
        gemini_rust::GenerateContentRequest,
    > for GoogleConverter
{
    type Error = MapperError;

    #[allow(clippy::too_many_lines)]
    fn try_convert(
        &self,
        value: async_openai::types::CreateChatCompletionRequest,
    ) -> Result<gemini_rust::GenerateContentRequest, Self::Error> {
        use anthropic_ai_sdk::types::message as anthropic;
        use async_openai::types as openai;
        use gemini_rust as google;

        let target_provider = InferenceProvider::Google;
        let source_model = Model::from_str(&value.model)?;
        let target_model = self
            .model_mapper
            .map_model(&source_model, &target_provider)?;
        tracing::trace!(source_model = ?source_model, target_model = ?target_model, "mapped model");
        let system_prompt = system_prompt(&value);
        let max_tokens =
            value.max_completion_tokens.unwrap_or(DEFAULT_MAX_TOKENS) as i32;
        let temperature = value.temperature;
        let stop_sequences = match value.stop {
            Some(openai::Stop::String(stop)) => Some(vec![stop]),
            Some(openai::Stop::StringArray(stops)) => Some(stops),
            None => None,
        };
        let tools = if let Some(tools) = value.tools {
            let mapped_tools: Vec<_> = tools
                .iter()
                .map(|tool| {
                    google::Tool::new(google::FunctionDeclaration {
                        name: tool.function.name.clone(),
                        description: tool
                            .function
                            .description
                            .clone()
                            .unwrap_or_default(),
                        parameters: google::value_to_function_parameters(
                            tool.function
                                .parameters
                                .clone()
                                .unwrap_or_default(),
                        ),
                    })
                })
                .collect();
            Some(mapped_tools)
        } else {
            None
        };
        let stream = value.stream; // TODO stream is set at the api call for gemini
        let top_p = value.top_p;

        let mut mapped_contents = Vec::with_capacity(value.messages.len());
        for message in value.messages {
            match message {
                // we've already set the system prompt
                openai::ChatCompletionRequestMessage::Developer(_)
                | openai::ChatCompletionRequestMessage::System(_) => {}
                openai::ChatCompletionRequestMessage::User(message) => {
                    let mapped_content = match message.content {
                        openai::ChatCompletionRequestUserMessageContent::Text(content) => {
                            google::Content::text(content)
                        },
                        openai::ChatCompletionRequestUserMessageContent::Array(content) => {
                            let mapped_parts = content.into_iter().filter_map(|part| {
                                match part {
                                    openai::ChatCompletionRequestUserMessageContentPart::Text(text) => {
                                        Some(google::Part::Text { text: text.text })
                                    },
                                    openai::ChatCompletionRequestUserMessageContentPart::ImageUrl(image) => {
                                        let mapped_image = if image.image_url.url.starts_with("http") {
                                            google::ImageSource::Url {
                                                url: image.image_url.url,
                                            }
                                        } else {
                                            google::ImageSource::Base64 {
                                                media_type: google::ImageMediaType::Png,
                                                data: image.image_url.url,
                                            }
                                        };
                                        Some(google::Part::Image { source: mapped_image })
                                    },
                                    openai::ChatCompletionRequestUserMessageContentPart::InputAudio(_audio) => {                                         // Anthropic API does not support audio
                                        // Anthropic does not support audio
                                        None
                                    },
                                }
                            }).collect();
                            google::Content { parts:  mapped_parts, role: None  }
                        },
                    };
                    mapped_contents.push(mapped_content);
                }
                openai::ChatCompletionRequestMessage::Assistant(message) => {
                    let mapped_content = match message.content {
                        Some(openai::ChatCompletionRequestAssistantMessageContent::Text(content)) => {
                            google::Content::text(content)
                        },
                        Some(openai::ChatCompletionRequestAssistantMessageContent::Array(content)) => {
                            let mapped_parts = content.into_iter().map(|part| {
                                match part {
                                    openai::ChatCompletionRequestAssistantMessageContentPart::Text(text) => {
                                        google::Part::Text { text: text.text }
                                    },
                                    openai::ChatCompletionRequestAssistantMessageContentPart::Refusal(text) => {
                                        google::Part::Text { text: text.refusal.clone() }
                                    },
                                }
                            }).collect();
                            google::Content { parts: mapped_parts, role: None }
                        },
                        None => continue,
                    };
                    mapped_contents.push(mapped_content);
                }
                // For now do not support tools yet
                openai::ChatCompletionRequestMessage::Tool(message) => {
                    // let mapped_content = match message.content {
                    //     openai::ChatCompletionRequestToolMessageContent::Text(text) => {
                    //         let block = anthropic::ContentBlock::ToolResult {
                    //             tool_use_id: message.tool_call_id,
                    //             content:
                    // anthropic::ToolResultContent::TextContent(text),
                    //         };
                    //         anthropic::MessageContent::Blocks { content:
                    // vec![block] }     },
                    //     openai::ChatCompletionRequestToolMessageContent::Array(content) => {
                    //         let mapped_content_blocks =
                    // content.into_iter().map(|part| {
                    //             match part {
                    //
                    // openai::ChatCompletionRequestToolMessageContentPart::Text(text)
                    // => {
                    // anthropic::ContentBlock::ToolResult { tool_use_id:
                    // message.tool_call_id.clone(), content:
                    // anthropic::ToolResultContent::TextContent(text.text) }
                    //                 },
                    //             }
                    //         }).collect();
                    //         anthropic::MessageContent::Blocks { content:
                    // mapped_content_blocks }     },
                    // };
                    // let mapped_message = anthropic::Message {
                    //     role: anthropic::Role::Assistant,
                    //     content: mapped_content,
                    // };
                    // mapped_messages.push(mapped_message);
                    continue;
                }
                openai::ChatCompletionRequestMessage::Function(message) => {
                    let Some(tool) = tools.as_ref().and_then(|tools| {
                        tools
                            .iter()
                            .find(|tool| match tool {
                                google::Tool::Function {
                                    function_declarations,
                                    ..
                                } => function_declarations.iter().any(
                                    |function_declaration| {
                                        function_declaration.name
                                            == message.name
                                    },
                                ),
                                _ => false,
                            })
                            .cloned()
                    }) else {
                        continue;
                    };

                    let function_declaration = match tool {
                        google::Tool::Function {
                            function_declarations,
                            ..
                        } => function_declarations
                            .iter()
                            .find(|fd| fd.name == message.name)
                            .unwrap()
                            .clone(),
                        _ => unreachable!(),
                    };

                    let mapped_content =
                        google::Content::function_call(google::FunctionCall {
                            name: function_declaration.name.clone(),
                            args: serde_json::to_value(
                                message.content.unwrap_or_default(),
                            )
                            .map_err(super::error::MapperError::SerdeError)?,
                        });
                    mapped_contents.push(mapped_content);
                }
            }
        }

        Ok(google::GenerateContentRequest {
            contents: mapped_contents,
            safety_settings: None,
            tools,
            tool_config: None,
            generation_config: Some(google::GenerationConfig {
                temperature,
                top_p,
                top_k: None,
                max_output_tokens: Some(max_tokens),
                candidate_count: None,
                stop_sequences,
                response_mime_type: None,
                response_schema: None,
            }),
            system_instruction: None,
        })
    }
}

impl
    TryConvert<
        anthropic_ai_sdk::types::message::CreateMessageResponse,
        async_openai::types::CreateChatCompletionResponse,
    > for GoogleConverter
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

        let prompt_tokens_details = value
            .usage
            .cache_creation_input_tokens
            .map(|cache_creation_input_tokens| openai::PromptTokensDetails {
                cached_tokens: Some(cache_creation_input_tokens),
                audio_tokens: None,
            });

        let usage = openai::CompletionUsage {
            prompt_tokens: value.usage.input_tokens,
            completion_tokens: value.usage.output_tokens,
            total_tokens: value.usage.input_tokens + value.usage.output_tokens,
            prompt_tokens_details,
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
                anthropic::ContentBlock::ServerToolUse { id, name, input } => {
                    tool_calls.push(openai::ChatCompletionMessageToolCall {
                        id: id.clone(),
                        r#type: openai::ChatCompletionToolType::Function,
                        function: openai::FunctionCall {
                            name: name.clone(),
                            arguments: serde_json::to_string(&input)?,
                        },
                    });
                }
                anthropic::ContentBlock::Text { text, .. } => {
                    content = Some(text.clone());
                }
                anthropic::ContentBlock::WebSearchToolResult { .. }
                | anthropic::ContentBlock::Image { .. }
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
    > for GoogleConverter
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
                        }
                        | anthropic::ContentBlock::ServerToolUse {
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
                                                .map_err(super::error::MapperError::SerdeError)?,
                                        ),
                                    }),
                                }
                            );
                        }
                        anthropic::ContentBlock::ToolResult {
                            tool_use_id: _,
                            content,
                        } => match content {
                            anthropic::ToolResultContent::TextContent(text) => {
                                current_text_content.push('\n');
                                current_text_content.push_str(text);
                            }
                            anthropic::ToolResultContent::Blocks(
                                tool_result_blocks,
                            ) => {
                                current_text_content.push('\n');
                                for block in tool_result_blocks {
                                    if let anthropic::ToolResultBlock::Text {
                                        text,
                                    } = block
                                    {
                                        current_text_content.push_str(text);
                                    }
                                }
                            }
                        },
                        _ => {}
                    }
                }

                let finish_reason = match message.stop_reason {
                    Some(
                        anthropic::StopReason::EndTurn
                        | anthropic::StopReason::StopSequence
                        | anthropic::StopReason::PauseTurn,
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
                        let tool_call_chunk = openai::ChatCompletionMessageToolCallChunk {
                            index: u32::try_from(index).unwrap_or(0),
                            id: Some(id),
                            r#type: Some(openai::ChatCompletionToolType::Function),
                            function: Some(openai::FunctionCallStream {
                                name: Some(name),
                                arguments: Some(serde_json::to_string(&input).map_err(super::error::MapperError::SerdeError)?),
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
                    anthropic::ContentBlockDelta::CitationsDelta { .. }
                    | anthropic::ContentBlockDelta::ThinkingDelta { .. }
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
                        | anthropic::StopReason::StopSequence
                        | anthropic::StopReason::PauseTurn,
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
                    prompt_tokens: usage.input_tokens,
                    completion_tokens: usage.output_tokens,
                    total_tokens: usage.input_tokens + usage.output_tokens,
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
