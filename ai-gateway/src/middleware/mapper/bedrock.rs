use std::{collections::HashMap, str::FromStr};

use async_openai::types::{
    CreateChatCompletionResponse, CreateChatCompletionStreamResponse,
};
use uuid::Uuid;

use super::{
    MapperError, TryConvert, TryConvertStreamData, model::ModelMapper,
};
use crate::{
    middleware::mapper::DEFAULT_MAX_TOKENS,
    types::{model_id::ModelId, provider::InferenceProvider},
};

pub struct BedrockConverter {
    model_mapper: ModelMapper,
}

impl BedrockConverter {
    #[must_use]
    pub fn new(model_mapper: ModelMapper) -> Self {
        Self { model_mapper }
    }
}

impl
    TryConvert<
        async_openai::types::CreateChatCompletionRequest,
        aws_sdk_bedrockruntime::operation::converse::ConverseInput,
    > for BedrockConverter
{
    type Error = MapperError;
    #[allow(clippy::too_many_lines)]
    fn try_convert(
        &self,
        value: async_openai::types::CreateChatCompletionRequest,
    ) -> Result<
        aws_sdk_bedrockruntime::operation::converse::ConverseInput,
        Self::Error,
    > {
        use async_openai::types as openai;
        use aws_sdk_bedrockruntime::types as bedrock;
        let target_provider = InferenceProvider::Bedrock;
        let source_model = ModelId::from_str(&value.model)?;

        let target_model = self
            .model_mapper
            .map_model(&source_model, &target_provider)?;

        tracing::trace!(source_model = ?source_model, target_model = ?target_model, "mapped model");

        let max_tokens =
            value.max_completion_tokens.unwrap_or(DEFAULT_MAX_TOKENS);
        let stop_sequences = match value.stop {
            Some(openai::Stop::String(stop)) => Some(vec![stop]),
            Some(openai::Stop::StringArray(stops)) => Some(stops),
            None => None,
        };
        let temperature = value.temperature;
        let top_p = value.top_p;

        let metadata = value
            .user
            .map(|user| HashMap::from([("user_id".to_string(), user)]));

        let tool_choice = match value.tool_choice {
            Some(openai::ChatCompletionToolChoiceOption::Named(tool)) => {
                let t = bedrock::SpecificToolChoice::builder()
                    .name(tool.function.name)
                    .build();
                if let Ok(t) = t {
                    Some(bedrock::ToolChoice::Tool(t))
                } else {
                    None
                }
            }
            Some(openai::ChatCompletionToolChoiceOption::Auto) => {
                Some(bedrock::ToolChoice::Auto(
                    bedrock::AutoToolChoice::builder().build(),
                ))
            }
            Some(openai::ChatCompletionToolChoiceOption::Required) => {
                Some(bedrock::ToolChoice::Any(
                    bedrock::AnyToolChoice::builder().build(),
                ))
            }
            Some(openai::ChatCompletionToolChoiceOption::None) | None => None,
        };

        let tools = if let Some(tools) = value.tools {
            let mapped_tools: Vec<_> = tools
                .into_iter()
                .filter_map(|tool| {
                    let parameters = tool.function.parameters?;
                    let json_value = serde_json::from_value(parameters).ok()?;
                    let tool_spec = bedrock::ToolSpecification::builder()
                        .name(tool.function.name.clone())
                        .set_description(tool.function.description.clone())
                        .input_schema(bedrock::ToolInputSchema::Json(
                            json_value,
                        ))
                        .build()
                        .ok()?;

                    Some(bedrock::Tool::ToolSpec(tool_spec))
                })
                .collect();
            Some(mapped_tools)
        } else {
            None
        };

        let mut mapped_messages = Vec::with_capacity(value.messages.len());
        for message in value.messages {
            match message {
                openai::ChatCompletionRequestMessage::Developer(_)
                | openai::ChatCompletionRequestMessage::System(_) => {}
                openai::ChatCompletionRequestMessage::User(message) => {
                    let mapped_content: Vec<bedrock::ContentBlock> = match message.content {
                        openai::ChatCompletionRequestUserMessageContent::Text(content) => {
                            vec![bedrock::ContentBlock::Text(content)]
                        }
                        openai::ChatCompletionRequestUserMessageContent::Array(content) => {
                            content.into_iter().filter_map(|part| {
                                match part {
                                    openai::ChatCompletionRequestUserMessageContentPart::Text(text) => {
                                        Some(bedrock::ContentBlock::Text(text.text))
                                    }
                                    openai::ChatCompletionRequestUserMessageContentPart::ImageUrl(image) => {
                                        if image.image_url.url.starts_with("http") {
                                            None
                                        } else {
                                            let mapped_image = bedrock::ImageBlock::builder().format(
                                                bedrock::ImageFormat::Png,
                                            ).source(
                                                bedrock::ImageSource::Bytes(aws_sdk_bedrockruntime::primitives::Blob::new(image.image_url.url))
                                            ).build().ok()?;
                                            Some(bedrock::ContentBlock::Image(mapped_image))
                                        }
                                    }
                                    openai::ChatCompletionRequestUserMessageContentPart::InputAudio(_audio) => {
                                        None
                                    }
                                }
                            }).collect()
                        }
                    };
                    let mapped_message = bedrock::Message::builder()
                        .role(bedrock::ConversationRole::User)
                        .set_content(Some(mapped_content))
                        .build();

                    if let Ok(mapped_message) = mapped_message {
                        mapped_messages.push(mapped_message);
                    }
                }
                openai::ChatCompletionRequestMessage::Assistant(message) => {
                    let mapped_content = match message.content {
                        Some(openai::ChatCompletionRequestAssistantMessageContent::Text(content)) => {
                            vec![bedrock::ContentBlock::Text(content)]
                        }
                        Some(openai::ChatCompletionRequestAssistantMessageContent::Array(content)) => {
                            content.into_iter().map(|part| {
                                match part {
                                    openai::ChatCompletionRequestAssistantMessageContentPart::Text(text) => {
                                        bedrock::ContentBlock::Text(text.text)
                                    }
                                    openai::ChatCompletionRequestAssistantMessageContentPart::Refusal(text) => {
                                        bedrock::ContentBlock::Text(text.refusal.clone())
                                    }
                                }
                            }).collect()
                        }
                        None => continue,
                    };
                    let mapped_message = bedrock::Message::builder()
                        .role(bedrock::ConversationRole::Assistant)
                        .set_content(Some(mapped_content))
                        .build();
                    if let Ok(mapped_message) = mapped_message {
                        mapped_messages.push(mapped_message);
                    }
                }
                openai::ChatCompletionRequestMessage::Tool(message) => {
                    let mapped_content = match message.content {
                        openai::ChatCompletionRequestToolMessageContent::Text(text) => {
                            let x = bedrock::ToolResultBlock::builder().tool_use_id(message.tool_call_id).content(
                                    bedrock::ToolResultContentBlock::Text(text)
                                ).build();
                            if let Ok(tool_result_block) = x {
                                vec![bedrock::ContentBlock::ToolResult(tool_result_block)]
                            } else {
                                vec![]
                            }
                        }
                        openai::ChatCompletionRequestToolMessageContent::Array(content) => {
                            content.into_iter().filter_map(|part| {
                                match part {
                                    openai::ChatCompletionRequestToolMessageContentPart::Text(text) => {
                                        let tool_result_block = bedrock::ToolResultBlock::builder()
                                                .tool_use_id(message.tool_call_id.clone())
                                                .content(
                                                    bedrock::ToolResultContentBlock::Text(text.text)
                                                )
                                                .build().ok()?;
                                        Some(bedrock::ContentBlock::ToolResult(tool_result_block))
                                    }
                                }
                            }).collect()
                        }
                    };

                    let mapped_message = bedrock::Message::builder()
                        .role(bedrock::ConversationRole::Assistant)
                        .set_content(Some(mapped_content))
                        .build();
                    if let Ok(mapped_message) = mapped_message {
                        mapped_messages.push(mapped_message);
                    }
                }
                openai::ChatCompletionRequestMessage::Function(message) => {
                    let tools_ref = tools.as_ref();
                    let Some(tool) = tools_ref.and_then(|tools| {
                        tools.iter().find_map(|tool| {
                            if let bedrock::Tool::ToolSpec(spec) = tool {
                                if spec.name == message.name {
                                    Some(tool.clone())
                                } else {
                                    None
                                }
                            } else {
                                None
                            }
                        })
                    }) else {
                        continue;
                    };

                    let tool_spec = tool.as_tool_spec().map_err(|_| {
                        MapperError::ToolMappingInvalid(message.name.clone())
                    })?;

                    let input = tool_spec
                        .input_schema
                        .as_ref()
                        .and_then(|schema| schema.as_json().ok())
                        .cloned();

                    let tool_use = bedrock::ToolUseBlock::builder()
                        .name(message.name.clone())
                        .tool_use_id(message.name.clone())
                        .set_input(input)
                        .build();
                    let mapped_content = if let Ok(tool_use) = tool_use {
                        vec![bedrock::ContentBlock::ToolUse(tool_use)]
                    } else {
                        vec![]
                    };

                    let mapped_message = bedrock::Message::builder()
                        .role(bedrock::ConversationRole::Assistant)
                        .set_content(Some(mapped_content))
                        .build();
                    if let Ok(mapped_message) = mapped_message {
                        mapped_messages.push(mapped_message);
                    }
                }
            }
        }

        let mut builder =
            aws_sdk_bedrockruntime::operation::converse::ConverseInput::builder()
                .model_id(target_model.to_string())
                .set_messages(Some(mapped_messages))
                .set_request_metadata(metadata);

        if let Some(tools) = tools {
            let tool_config = bedrock::ToolConfiguration::builder()
                .set_tool_choice(tool_choice)
                .set_tools(Some(tools))
                .build();
            if let Ok(tool_config) = tool_config {
                builder = builder.tool_config(tool_config);
            }
        }
        #[allow(clippy::cast_possible_wrap)]
        let inference_config = Some(
            bedrock::InferenceConfiguration::builder()
                .top_p(top_p.unwrap_or_default())
                .temperature(temperature.unwrap_or_default())
                .max_tokens(
                    i32::try_from(max_tokens)
                        .unwrap_or(DEFAULT_MAX_TOKENS as i32),
                )
                .set_stop_sequences(stop_sequences)
                .build(),
        );
        let converse_input = builder
            .set_inference_config(inference_config)
            .build()
            .map_err(|e| MapperError::FailedToMapBedrockMessage(e.into()))?;

        Ok(converse_input)
    }
}

impl
    TryConvert<
        aws_sdk_bedrockruntime::operation::converse::ConverseOutput,
        CreateChatCompletionResponse,
    > for BedrockConverter
{
    type Error = MapperError;

    #[allow(clippy::too_many_lines, clippy::cast_possible_wrap)]
    fn try_convert(
        &self,
        value: aws_sdk_bedrockruntime::operation::converse::ConverseOutput,
    ) -> std::result::Result<CreateChatCompletionResponse, Self::Error> {
        use async_openai::types as openai;
        use aws_sdk_bedrockruntime::types as bedrock;
        let model = value
            .trace
            .and_then(|t| t.prompt_router)
            .and_then(|r| r.invoked_model_id)
            .unwrap_or_default();

        let created = 0;
        let usage = if let Some(usage) = value.usage {
            usage
        } else {
            bedrock::TokenUsage::builder()
                .input_tokens(DEFAULT_MAX_TOKENS as i32)
                .output_tokens(DEFAULT_MAX_TOKENS as i32)
                .total_tokens(DEFAULT_MAX_TOKENS as i32)
                .build()
                .map_err(|e| MapperError::FailedToMapBedrockMessage(e.into()))?
        };

        let usage = openai::CompletionUsage {
            prompt_tokens: usage.input_tokens.try_into().unwrap_or(0),
            completion_tokens: usage.output_tokens.try_into().unwrap_or(0),
            total_tokens: usage.total_tokens.try_into().unwrap_or(0),
            prompt_tokens_details: Some(openai::PromptTokensDetails {
                audio_tokens: None,
                cached_tokens: usage
                    .cache_read_input_tokens
                    .and_then(|i| i.try_into().ok()),
            }),
            completion_tokens_details: None,
        };

        let mut tool_calls: Vec<openai::ChatCompletionMessageToolCall> =
            Vec::new();
        let mut content = None;
        let contents = if let Some(output) = value.output {
            if let Ok(message) = output.as_message() {
                message.content.clone()
            } else {
                Vec::new()
            }
        } else {
            Vec::new()
        };
        for bedrock_content in contents {
            match bedrock_content {
                bedrock::ContentBlock::ToolUse(tool_use_block) => {
                    tool_calls.push(openai::ChatCompletionMessageToolCall {
                        id: tool_use_block.tool_use_id.clone(),
                        r#type: openai::ChatCompletionToolType::Function,
                        function: openai::FunctionCall {
                            name: tool_use_block.name.clone(),
                            arguments: tool_use_block
                                .input
                                .as_string()
                                .unwrap_or_default()
                                .to_string(),
                        },
                    });
                }
                bedrock::ContentBlock::ToolResult(tool_result_block) => {
                    tool_calls.push(openai::ChatCompletionMessageToolCall {
                        id: tool_result_block.tool_use_id.clone(),
                        r#type: openai::ChatCompletionToolType::Function,
                        function: openai::FunctionCall {
                            name: tool_result_block.tool_use_id.clone(),
                            arguments: serde_json::to_string(&content)?,
                        },
                    });
                }
                bedrock::ContentBlock::Text(text) => {
                    content = Some(text.clone());
                }
                bedrock::ContentBlock::ReasoningContent(reasoning) => {
                    if let Ok(reasoning_text) = reasoning.as_reasoning_text() {
                        content = Some(reasoning_text.text.clone());
                    }
                }
                bedrock::ContentBlock::GuardContent(guard) => {
                    if let Ok(guard_content) = guard.as_text() {
                        content = Some(guard_content.text.clone());
                    }
                }
                bedrock::ContentBlock::Image(_)
                | bedrock::ContentBlock::Document(_)
                | bedrock::ContentBlock::CachePoint(_)
                | bedrock::ContentBlock::Video(_)
                | _ => {}
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
            id: String::from(Uuid::new_v4()),
            created,
            model,
            object: crate::middleware::mapper::anthropic::OPENAI_CHAT_COMPLETION_OBJECT.to_string(),
            usage: Some(usage),
            service_tier: None,
            system_fingerprint: None,
        };
        Ok(response)
    }
}

impl
    TryConvertStreamData<
        aws_sdk_bedrockruntime::types::ConverseStreamOutput,
        CreateChatCompletionStreamResponse,
    > for BedrockConverter
{
    type Error = MapperError;

    #[allow(clippy::too_many_lines)]
    fn try_convert_chunk(
        &self,
        value: aws_sdk_bedrockruntime::types::ConverseStreamOutput,
    ) -> Result<
        std::option::Option<CreateChatCompletionStreamResponse>,
        Self::Error,
    > {
        use async_openai::types as openai;
        use aws_sdk_bedrockruntime::types as bedrock;
        const CHAT_COMPLETION_CHUNK_OBJECT: &str = "chat.completion.chunk";
        // TODO: These placeholder values for id, model, and created should be
        // replaced by actual values from the MessageStart event,
        // propagated by the stream handling logic.
        const PLACEHOLDER_STREAM_ID: &str = "bedrock-stream-id";
        const PLACEHOLDER_MODEL_NAME: &str = "bedrock-model";
        const DEFAULT_CREATED_TIMESTAMP: u32 = 0;

        #[allow(deprecated)]
        let mut choices = Vec::new();
        let mut completion_usage: openai::CompletionUsage =
            openai::CompletionUsage {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
                prompt_tokens_details: None,
                completion_tokens_details: None,
            };
        match value {
            bedrock::ConverseStreamOutput::MessageStart(message) => {
                let choice = openai::ChatChoiceStream {
                    index: 0,
                    delta: openai::ChatCompletionStreamResponseDelta {
                        role: Some(match message.role {
                            bedrock::ConversationRole::Assistant => {
                                openai::Role::Assistant
                            }
                            bedrock::ConversationRole::User => {
                                openai::Role::User
                            }
                            _ => openai::Role::System,
                        }),
                        content: None,
                        tool_calls: None,
                        refusal: None,
                        #[allow(deprecated)]
                        function_call: None,
                    },
                    finish_reason: None,
                    logprobs: None,
                };

                choices.push(choice);
            }
            bedrock::ConverseStreamOutput::ContentBlockStart(
                content_block_start,
            ) => {
                if let Some(bedrock::ContentBlockStart::ToolUse(tool_use)) =
                    content_block_start.start
                {
                    let tool_call_chunk =
                        openai::ChatCompletionMessageToolCallChunk {
                            index: content_block_start
                                .content_block_index
                                .try_into()
                                .unwrap_or(0),
                            id: Some(tool_use.tool_use_id),
                            r#type: Some(
                                openai::ChatCompletionToolType::Function,
                            ),
                            function: Some(openai::FunctionCallStream {
                                name: Some(tool_use.name),
                                arguments: Some(String::new()),
                            }),
                        };
                    let choice = openai::ChatChoiceStream {
                        index: 0,
                        delta: openai::ChatCompletionStreamResponseDelta {
                            role: None,
                            content: None,
                            tool_calls: Some(vec![tool_call_chunk]),
                            refusal: None,
                            #[allow(deprecated)]
                            function_call: None,
                        },
                        finish_reason: None,
                        logprobs: None,
                    };

                    choices.push(choice);
                }
            }
            bedrock::ConverseStreamOutput::ContentBlockDelta(
                content_block_delta_event,
            ) => {
                match content_block_delta_event.delta {
                    Some(bedrock::ContentBlockDelta::Text(text)) => {
                        let choice = openai::ChatChoiceStream {
                            index: u32::try_from(
                                content_block_delta_event.content_block_index,
                            )
                            .unwrap_or(0),
                            delta: openai::ChatCompletionStreamResponseDelta {
                                role: None,
                                content: Some(text),
                                tool_calls: None,
                                refusal: None,
                                #[allow(deprecated)]
                                function_call: None,
                            },
                            finish_reason: None,
                            logprobs: None,
                        };
                        choices.push(choice);
                    }
                    Some(bedrock::ContentBlockDelta::ToolUse(tool_use)) => {
                        let tool_call_chunk =
                            openai::ChatCompletionMessageToolCallChunk {
                                index: u32::try_from(
                                    content_block_delta_event
                                        .content_block_index,
                                )
                                .unwrap_or(0),
                                id: None, /* ID would have been sent with ContentBlockStart for this tool */
                                r#type: Some(
                                    openai::ChatCompletionToolType::Function,
                                ), // Assuming function
                                function: Some(openai::FunctionCallStream {
                                    name: None, /* Name would have been sent
                                                 * with ContentBlockStart */
                                    arguments: Some(tool_use.input),
                                }),
                            };
                        let choice = openai::ChatChoiceStream {
                            index: 0,
                            delta: openai::ChatCompletionStreamResponseDelta {
                                role: None,
                                content: None,
                                tool_calls: Some(vec![tool_call_chunk]),
                                refusal: None,
                                #[allow(deprecated)]
                                function_call: None,
                            },
                            finish_reason: None,
                            logprobs: None,
                        };

                        choices.push(choice);
                    }
                    _ => {}
                }
            }

            bedrock::ConverseStreamOutput::Metadata(metadata) => {
                if let Some(usage) = metadata.usage {
                    completion_usage.prompt_tokens =
                        u32::try_from(usage.input_tokens).unwrap_or(0);
                    completion_usage.completion_tokens =
                        u32::try_from(usage.output_tokens).unwrap_or(0);
                    completion_usage.total_tokens =
                        u32::try_from(usage.total_tokens).unwrap_or(0);
                }
            }
            bedrock::ConverseStreamOutput::ContentBlockStop(_)
            | bedrock::ConverseStreamOutput::MessageStop(_)
            | _ => {}
        }

        Ok(Some(CreateChatCompletionStreamResponse {
            id: PLACEHOLDER_STREAM_ID.to_string(), /* TODO: Use actual
                                                    * stream
                                                    * ID */
            choices,
            created: DEFAULT_CREATED_TIMESTAMP, /* TODO: Use actual
                                                 * created
                                                 * timestamp */
            model: PLACEHOLDER_MODEL_NAME.to_string(), /* TODO: Use actual
                                                        * model name */
            object: CHAT_COMPLETION_CHUNK_OBJECT.to_string(),
            system_fingerprint: None,
            service_tier: None,
            usage: Some(completion_usage),
        }))
    }
}
