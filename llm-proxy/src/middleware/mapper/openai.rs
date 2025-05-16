use std::str::FromStr;

use super::{TryConvertStreamData, model::ModelMapper};
use crate::{
    middleware::mapper::{TryConvert, error::MapperError},
    types::{model::Model, provider::InferenceProvider},
};

const ANTHROPIC_MESSAGE_TYPE: &str = "message";

pub struct OpenAiConverter {
    model_mapper: ModelMapper,
}

impl OpenAiConverter {
    #[must_use]
    pub fn new(model_mapper: ModelMapper) -> Self {
        Self { model_mapper }
    }
}

impl
    TryConvert<
        anthropic_ai_sdk::types::message::CreateMessageParams,
        async_openai::types::CreateChatCompletionRequest,
    > for OpenAiConverter
{
    type Error = MapperError;

    #[allow(clippy::too_many_lines)]
    fn try_convert(
        &self,
        value: anthropic_ai_sdk::types::message::CreateMessageParams,
    ) -> std::result::Result<
        async_openai::types::CreateChatCompletionRequest,
        Self::Error,
    > {
        use anthropic_ai_sdk::types::message as anthropic;
        use async_openai::types as openai;
        let target_provider = InferenceProvider::OpenAI;
        let source_model = Model::from_str(&value.model)?;
        let target_model = self
            .model_mapper
            .map_model(&source_model, &target_provider)?;

        tracing::trace!(source_model = ?source_model, target_model = ?target_model, "mapped model");
        let reasoning_effort = if let Some(thinking) = value.thinking {
            match thinking {
                anthropic::ThinkingConfig::Enabled { budget_tokens } => {
                    let reasoning_budget =
                        f64::from(budget_tokens) / f64::from(value.max_tokens);
                    match reasoning_budget {
                        reasoning_budget if reasoning_budget < 0.33 => {
                            Some(openai::ReasoningEffort::Low)
                        }
                        reasoning_budget if reasoning_budget < 0.66 => {
                            Some(openai::ReasoningEffort::Medium)
                        }
                        reasoning_budget if reasoning_budget <= 1.0 => {
                            Some(openai::ReasoningEffort::High)
                        }
                        _ => Some(openai::ReasoningEffort::Medium),
                    }
                }
                anthropic::ThinkingConfig::Disabled => None,
            }
        } else {
            None
        };

        let max_completion_tokens = Some(value.max_tokens);
        let stop = value.stop_sequences.map(openai::Stop::StringArray);
        let stream = value.stream;
        let stream_options = if stream.is_some_and(|s| s) {
            Some(openai::ChatCompletionStreamOptions {
                include_usage: true,
            })
        } else {
            None
        };
        let temperature = value.temperature;
        let top_p = value.top_p;
        let (tool_choice, parallel_tool_calls): (
            Option<openai::ChatCompletionToolChoiceOption>,
            Option<bool>,
        ) = match value.tool_choice {
            Some(tool_choice) => match tool_choice {
                anthropic::ToolChoice::Auto {
                    disable_parallel_tool_use,
                } => (
                    Some(openai::ChatCompletionToolChoiceOption::Auto),
                    disable_parallel_tool_use,
                ),
                anthropic::ToolChoice::None => {
                    (Some(openai::ChatCompletionToolChoiceOption::None), None)
                }
                anthropic::ToolChoice::Any {
                    disable_parallel_tool_use,
                } => (
                    Some(openai::ChatCompletionToolChoiceOption::Required),
                    disable_parallel_tool_use,
                ),
                anthropic::ToolChoice::Tool {
                    name,
                    disable_parallel_tool_use,
                } => {
                    let named_tool_choice =
                        openai::ChatCompletionNamedToolChoice {
                            r#type: openai::ChatCompletionToolType::Function,
                            function: openai::FunctionName {
                                name: name.clone(),
                            },
                        };
                    (
                        Some(openai::ChatCompletionToolChoiceOption::Named(
                            named_tool_choice,
                        )),
                        disable_parallel_tool_use,
                    )
                }
            },
            None => (None, None),
        };
        let tools: Option<Vec<openai::ChatCompletionTool>> =
            if let Some(tools) = value.tools {
                let mapped_tools: Vec<_> = tools
                    .into_iter()
                    .filter_map(|tool| match tool {
                        anthropic::Tool::Custom {
                            name,
                            description,
                            input_schema,
                            ..
                        } => Some(openai::ChatCompletionTool {
                            r#type: openai::ChatCompletionToolType::Function,
                            function: openai::FunctionObject {
                                name,
                                description,
                                parameters: Some(input_schema),
                                strict: None,
                            },
                        }),
                        _ => None,
                    })
                    .collect();

                Some(mapped_tools)
            } else {
                None
            };
        let mut metadata = value.metadata;
        let user = metadata
            .as_mut()
            .and_then(|metadata| metadata.fields.remove("user_id"));
        let metadata = match metadata {
            Some(metadata) => Some(
                serde_json::to_value(metadata)
                    .map_err(|_| MapperError::InvalidRequest)?,
            ),
            None => None,
        };

        let mut messages: Vec<openai::ChatCompletionRequestMessage> =
            Vec::with_capacity(value.messages.len());
        if let Some(system_prompt) = value.system {
            messages.push(openai::ChatCompletionRequestMessage::Developer(openai::ChatCompletionRequestDeveloperMessage {
                content: openai::ChatCompletionRequestDeveloperMessageContent::Text(system_prompt),
                name: None,
            }));
        }
        for message in value.messages {
            let mapped_message: openai::ChatCompletionRequestMessage =
                match message.role {
                    anthropic::Role::Assistant => {
                        let mapped_content: openai::ChatCompletionRequestAssistantMessageContent = match message.content {
                        anthropic::MessageContent::Text { content } => {
                            openai::ChatCompletionRequestAssistantMessageContent::Text(content)
                        }
                        anthropic::MessageContent::Blocks { content } => {
                            let blocks = content.into_iter().filter_map(|block| {
                                match block {
                                    anthropic::ContentBlock::Text { text, .. } => {
                                        Some(openai::ChatCompletionRequestAssistantMessageContentPart::Text(openai::ChatCompletionRequestMessageContentPartText {
                                            text
                                        }))
                                    },
                                    anthropic::ContentBlock::Image { .. } |
                                    anthropic::ContentBlock::ToolUse { .. } |
                                    anthropic::ContentBlock::ToolResult { .. } |
                                    anthropic::ContentBlock::ServerToolUse { .. } |
                                    anthropic::ContentBlock::WebSearchToolResult { .. } |
                                    anthropic::ContentBlock::Thinking { .. } |
                                    anthropic::ContentBlock::RedactedThinking { .. } => {
                                        None
                                    }
                                }
                            }).collect();
                            openai::ChatCompletionRequestAssistantMessageContent::Array(blocks)
                        }
                    };
                        #[allow(deprecated)]
                        openai::ChatCompletionRequestMessage::Assistant(
                            openai::ChatCompletionRequestAssistantMessage {
                                content: Some(mapped_content),
                                tool_calls: None,
                                refusal: None,
                                name: None,
                                audio: None,
                                function_call: None,
                            },
                        )
                    }
                    anthropic::Role::User => {
                        let content: openai::ChatCompletionRequestUserMessageContent  = match message.content {
                        anthropic::MessageContent::Text { content } => {
                            openai::ChatCompletionRequestUserMessageContent::Text(content)
                        }
                        anthropic::MessageContent::Blocks { content } => {
                            let blocks = content.into_iter().filter_map(|block| {
                                match block {
                                    anthropic::ContentBlock::Text { text, .. } => {
                                        Some(openai::ChatCompletionRequestUserMessageContentPart::Text(openai::ChatCompletionRequestMessageContentPartText {
                                            text,
                                        }))
                                    },
                                    anthropic::ContentBlock::Image { source } => {
                                        let image_url = match source {
                                            anthropic::ImageSource::Base64 { media_type: _, data } => {
                                                openai::ImageUrl {
                                                    url: data,
                                                    detail: None,
                                                }
                                            },
                                            anthropic::ImageSource::Url { url } => {
                                                openai::ImageUrl {
                                                    url,
                                                    detail: None,
                                                }
                                            },
                                        };
                                        Some(openai::ChatCompletionRequestUserMessageContentPart::ImageUrl(openai::ChatCompletionRequestMessageContentPartImage {
                                            image_url,
                                        }))
                                    },
                                    anthropic::ContentBlock::ToolUse { .. } |
                                    anthropic::ContentBlock::ToolResult { .. } |
                                    anthropic::ContentBlock::ServerToolUse { .. } |
                                    anthropic::ContentBlock::WebSearchToolResult { .. } |
                                    anthropic::ContentBlock::Thinking { .. } |
                                    anthropic::ContentBlock::RedactedThinking { .. } => {
                                        None
                                    }
                                }
                            }).collect();
                            openai::ChatCompletionRequestUserMessageContent::Array(blocks)
                        }
                    };
                        openai::ChatCompletionRequestMessage::User(
                            openai::ChatCompletionRequestUserMessage {
                                content,
                                name: None,
                            },
                        )
                    }
                };
            messages.push(mapped_message);
        }

        #[allow(deprecated)]
        let request = async_openai::types::CreateChatCompletionRequest {
            messages,
            model: target_model.to_string(),
            store: None,
            reasoning_effort,
            metadata,
            parallel_tool_calls,
            stop,
            stream,
            stream_options,
            temperature,
            top_p,
            tools,
            tool_choice,
            user,
            max_completion_tokens,
            max_tokens: None,
            frequency_penalty: None,
            logit_bias: None,
            logprobs: None,
            n: None,
            modalities: None,
            presence_penalty: None,
            prediction: None,
            response_format: None,
            seed: None,
            service_tier: None,
            top_logprobs: None,
            audio: None,
            function_call: None,
            functions: None,
        };

        Ok(request)
    }
}

impl
    TryConvert<
        async_openai::types::CreateChatCompletionResponse,
        anthropic_ai_sdk::types::message::CreateMessageResponse,
    > for OpenAiConverter
{
    type Error = MapperError;

    #[allow(clippy::too_many_lines)]
    fn try_convert(
        &self,
        mut value: async_openai::types::CreateChatCompletionResponse,
    ) -> std::result::Result<
        anthropic_ai_sdk::types::message::CreateMessageResponse,
        Self::Error,
    > {
        use anthropic_ai_sdk::types::message as anthropic;
        let id = value.id;
        let model = value.model;
        let role = anthropic::Role::Assistant;
        // not exposed by OpenAI
        let stop_sequence: Option<String> = None;
        // For Messages, this is always "message"
        let type_ = ANTHROPIC_MESSAGE_TYPE.to_string();
        let usage = value.usage.map_or(
            anthropic::Usage {
                input_tokens: 0,
                output_tokens: 0,
                cache_creation_input_tokens: None,
                cache_read_input_tokens: None,
                server_tool_use: None,
            },
            |usage| {
                let cache_creation_input_tokens = usage
                    .prompt_tokens_details
                    .and_then(|details| details.cached_tokens);
                anthropic::Usage {
                    input_tokens: usage.prompt_tokens,
                    output_tokens: usage.completion_tokens,
                    cache_creation_input_tokens,
                    cache_read_input_tokens: None,
                    server_tool_use: None,
                }
            },
        );

        let openai_message = value.choices.remove(0);
        let stop_reason = if openai_message.message.refusal.is_some() {
            Some(anthropic::StopReason::Refusal)
        } else {
            None
        };
        let mut content: Vec<anthropic::ContentBlock> = Vec::new();

        if let Some(tool_uses) = openai_message.message.tool_calls {
            for tool_use in tool_uses {
                if let Ok(input) =
                    serde_json::from_str(&tool_use.function.arguments)
                {
                    let tool_use = anthropic::ContentBlock::ToolUse {
                        id: tool_use.id,
                        name: tool_use.function.name,
                        input,
                    };
                    content.push(tool_use);
                }
            }
        }
        if let Some(text) = openai_message.message.content {
            let text = anthropic::ContentBlock::Text {
                text,
                citations: None,
            };
            content.push(text);
        }

        Ok(anthropic::CreateMessageResponse {
            content,
            id,
            model,
            role,
            stop_reason,
            stop_sequence,
            type_,
            usage,
        })
    }
}

impl
    TryConvertStreamData<
        async_openai::types::CreateChatCompletionStreamResponse,
        anthropic_ai_sdk::types::message::StreamEvent,
    > for OpenAiConverter
{
    type Error = MapperError;

    #[allow(clippy::too_many_lines)]
    fn try_convert_chunk(
        &self,
        value: async_openai::types::CreateChatCompletionStreamResponse,
    ) -> std::result::Result<
        Option<anthropic_ai_sdk::types::message::StreamEvent>,
        Self::Error,
    > {
        use anthropic_ai_sdk::types::message as anthropic;
        use async_openai::types as openai;

        let choices = &value.choices;
        if choices.is_empty() {
            return Ok(None);
        }
        let first_choice = &choices[0];
        let delta = &first_choice.delta;

        // Priority 1: MessageStart Event (indicated by `role` field)
        if let Some(openai_role) = delta.role {
            let anthropic_role = match openai_role {
                openai::Role::Assistant => anthropic::Role::Assistant,
                openai::Role::User => anthropic::Role::User, /* Should not happen in assistant stream */
                _ => return Err(MapperError::InvalidRequest), /* Or a more specific error */
            };

            let mut content_blocks: Vec<anthropic::ContentBlock> = Vec::new();

            // Add text content if present in the MessageStart delta
            if let Some(text) = &delta.content {
                content_blocks.push(anthropic::ContentBlock::Text {
                    text: text.clone(),
                    citations: None,
                });
            }

            // Add tool_calls if present in the MessageStart delta
            if let Some(tool_call_chunks) = &delta.tool_calls {
                for tc_chunk in tool_call_chunks {
                    if let (Some(id), Some(func), Some(name)) = (
                        tc_chunk.id.as_ref(),
                        tc_chunk.function.as_ref(),
                        tc_chunk
                            .function
                            .as_ref()
                            .and_then(|f| f.name.as_ref()),
                    ) {
                        let input_str =
                            func.arguments.as_deref().unwrap_or("{}");
                        if let Ok(input_json) = serde_json::from_str(input_str)
                        {
                            let tool_use_block =
                                anthropic::ContentBlock::ToolUse {
                                    id: id.clone(),
                                    name: name.clone(),
                                    input: input_json,
                                };
                            content_blocks.push(tool_use_block);
                        }
                        // Handle error or default for bad JSON
                        let tool_use_block = anthropic::ContentBlock::ToolUse {
                            id: id.clone(),
                            name: name.clone(),
                            input: serde_json::json!({}),
                        };
                        content_blocks.push(tool_use_block);
                    }
                }
            }

            // Note: Anthropic's MessageStartContent.usage is full usage,
            // OpenAI stream start doesn't have it. It's sent with MessageDelta
            // typically. So, we initialize usage with default/zero
            // values.
            let initial_usage = anthropic::Usage {
                input_tokens: 0,
                output_tokens: 0,
                cache_creation_input_tokens: None,
                cache_read_input_tokens: None,
                server_tool_use: None,
            };

            let message_start_content = anthropic::MessageStartContent {
                id: value.id.clone(),
                type_: ANTHROPIC_MESSAGE_TYPE.to_string(),
                role: anthropic_role,
                content: content_blocks,
                model: value.model.clone(),
                stop_reason: None, // Stop reason comes later
                stop_sequence: None,
                usage: initial_usage,
            };
            return Ok(Some(anthropic::StreamEvent::MessageStart {
                message: message_start_content,
            }));
        }

        // Priority 2: MessageDelta Event (for finish_reason)
        if let Some(finish_reason) = first_choice.finish_reason {
            let anthropic_stop_reason = match finish_reason {
                openai::FinishReason::Stop => anthropic::StopReason::EndTurn,
                openai::FinishReason::Length => {
                    anthropic::StopReason::MaxTokens
                }
                openai::FinishReason::ToolCalls
                | openai::FinishReason::FunctionCall => {
                    anthropic::StopReason::ToolUse
                }
                openai::FinishReason::ContentFilter => {
                    anthropic::StopReason::Refusal
                }
            };

            let stream_usage = value.usage.map_or_else(
                || anthropic::StreamUsage {
                    // Default if OpenAI chunk has no usage
                    input_tokens: 0,
                    output_tokens: 0,
                    cache_creation_input_tokens: None,
                    cache_read_input_tokens: None,
                    server_tool_use: None,
                },
                |u| anthropic::StreamUsage {
                    input_tokens: u.prompt_tokens,
                    output_tokens: u.completion_tokens,
                    cache_creation_input_tokens: u
                        .prompt_tokens_details
                        .and_then(|d| d.cached_tokens),
                    cache_read_input_tokens: None, /* OpenAI stream usage
                                                    * doesn't provide this */
                    server_tool_use: None, /* OpenAI stream usage doesn't
                                            * provide this */
                },
            );

            let message_delta_content = anthropic::MessageDeltaContent {
                stop_reason: Some(anthropic_stop_reason),
                stop_sequence: None, /* OpenAI stream doesn't provide the
                                      * matched stop sequence in delta */
            };
            return Ok(Some(anthropic::StreamEvent::MessageDelta {
                delta: message_delta_content,
                usage: stream_usage,
            }));
        }

        // Priority 3: Tool Call Events
        if let Some(tool_call_chunks) = &delta.tool_calls {
            if let Some(tc_chunk) = tool_call_chunks.first() {
                // Process only the first tool_call_chunk due to
                // Option<StreamEvent> return
                let anthropic_block_idx = tc_chunk.index as usize; // Use OpenAI's tool index as Anthropic's content block index

                // Check if it's a new tool call (ContentBlockStart)
                if let (Some(id), Some(func), Some(name)) = (
                    tc_chunk.id.as_ref(),
                    tc_chunk.function.as_ref(),
                    tc_chunk.function.as_ref().and_then(|f| f.name.as_ref()),
                ) {
                    let input_str = func.arguments.as_deref().unwrap_or("{}");
                    if let Ok(input_json) = serde_json::from_str(input_str) {
                        let tool_use_block = anthropic::ContentBlock::ToolUse {
                            id: id.clone(),
                            name: name.clone(),
                            input: input_json,
                        };
                        return Ok(Some(
                            anthropic::StreamEvent::ContentBlockStart {
                                index: anthropic_block_idx,
                                content_block: tool_use_block,
                            },
                        ));
                    }
                    // Handle error or default for bad JSON
                    let tool_use_block = anthropic::ContentBlock::ToolUse {
                        id: id.clone(),
                        name: name.clone(),
                        input: serde_json::json!({}),
                    };
                    return Ok(Some(
                        anthropic::StreamEvent::ContentBlockStart {
                            index: anthropic_block_idx,
                            content_block: tool_use_block,
                        },
                    ));
                }
                // Check if it's a delta for an existing tool call's arguments
                // (ContentBlockDelta)
                else if let Some(func_args) = tc_chunk
                    .function
                    .as_ref()
                    .and_then(|f| f.arguments.as_ref())
                {
                    let input_json_delta =
                        anthropic::ContentBlockDelta::InputJsonDelta {
                            partial_json: func_args.clone(),
                        };
                    return Ok(Some(
                        anthropic::StreamEvent::ContentBlockDelta {
                            index: anthropic_block_idx,
                            delta: input_json_delta,
                        },
                    ));
                }
            }
        }

        // Priority 4: Text Content Delta
        if let Some(text_content) = &delta.content {
            let text_delta = anthropic::ContentBlockDelta::TextDelta {
                text: text_content.clone(),
            };
            // Convention: general text deltas map to Anthropic content block
            // index 0
            return Ok(Some(anthropic::StreamEvent::ContentBlockDelta {
                index: 0,
                delta: text_delta,
            }));
        }

        // Priority 5: Refusal Content Delta (if OpenAI includes it separately)
        if let Some(refusal_text) = &delta.refusal {
            let refusal_delta = anthropic::ContentBlockDelta::TextDelta {
                text: refusal_text.clone(),
            };
            // Convention: map refusal text to Anthropic content block index 0
            // (or a specific index for refusals)
            return Ok(Some(anthropic::StreamEvent::ContentBlockDelta {
                index: 0,
                delta: refusal_delta,
            }));
        }

        Ok(None) // No convertible event found in this chunk
    }
}
