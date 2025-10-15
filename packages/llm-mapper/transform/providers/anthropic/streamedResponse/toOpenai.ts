import { AnthropicStreamEvent } from "../../../types/anthropic";
import {
  OpenAIStreamEvent,
  ChatCompletionChunk,
  OpenAIStreamChoice,
  OpenAIAnnotation,
} from "../../../types/openai";

export class AnthropicToOpenAIStreamConverter {
  private messageId: string = "";
  private model: string = "";
  private created: number = 0;
  private finalUsage: ChatCompletionChunk["usage"] | null = null;
  private toolCallState: Map<
    number,
    {
      id: string;
      name: string;
      arguments: string;
      toolCallIndex: number;
      hasNonEmptyDelta: boolean;
    }
  > = new Map();
  private nextToolCallIndex: number = 0;
  private annotations: OpenAIAnnotation[] = [];
  private currentContentLength: number = 0;

  constructor() {
    this.created = Math.floor(Date.now() / 1000);
  }

  processLines(raw: string, onChunk: (chunk: ChatCompletionChunk) => void) {
    const chunks: ChatCompletionChunk[] = [];
    const lines = raw.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const jsonStr = line.slice(6);

          // Skip the [DONE] message from Anthropic
          if (jsonStr.trim() === "[DONE]") {
            continue;
          }

          const anthropicEvent = JSON.parse(jsonStr);
          const openAIEvents = this.convert(anthropicEvent);

          for (const openAIEvent of openAIEvents) {
            onChunk(openAIEvent);
          }
        } catch (error) {
          console.error("Failed to parse SSE data:", error);
        }
      } else if (line.startsWith("event:") || line.startsWith(":")) {
        // Skip event type lines and comments
        continue;
      }
    }
  }

  convert(event: AnthropicStreamEvent): OpenAIStreamEvent[] {
    const chunks: OpenAIStreamEvent[] = [];

    switch (event.type) {
      case "message_start":
        this.messageId = event.message.id;
        this.model = event.message.model;
        this.toolCallState.clear();
        this.nextToolCallIndex = 0;
        this.annotations = [];
        this.currentContentLength = 0;

        chunks.push(
          this.createChunk({
            choices: [
              {
                index: 0,
                delta: {
                  role: "assistant",
                  content: "",
                },
                logprobs: null,
                finish_reason: null,
              },
            ],
          })
        );
        break;

      case "content_block_start":
        if (event.content_block.type === "text") {
          // Check if this text block has citations
          if (
            event.content_block.citations &&
            event.content_block.citations.length > 0
          ) {
            // Calculate start position for this text block
            const blockStartIndex = this.currentContentLength;
            const blockText = event.content_block.text || "";
            const blockEndIndex = blockStartIndex + blockText.length;

            // Add citations as annotations
            for (const citation of event.content_block.citations) {
              this.annotations.push({
                type: "url_citation",
                url_citation: {
                  url: citation.url,
                  title: citation.title,
                  content: citation.cited_text,
                  start_index: blockStartIndex,
                  end_index: blockEndIndex,
                },
              });
            }
          }
        } else if (event.content_block.type === "tool_use") {
          // Store tool call metadata and emit the initial tool call chunk
          const toolCall = {
            id: event.content_block.id || "",
            name: event.content_block.name || "",
            arguments: "{}",
            toolCallIndex: this.nextToolCallIndex++,
            hasNonEmptyDelta: false,
          };
          this.toolCallState.set(event.index, toolCall);

          chunks.push(
            this.createChunk({
              choices: [
                {
                  index: 0,
                  delta: {
                    tool_calls: [
                      {
                        index: toolCall.toolCallIndex,
                        id: toolCall.id,
                        type: "function",
                        function: {
                          name: toolCall.name,
                          arguments: "",
                        },
                      },
                    ],
                  },
                  logprobs: null,
                  finish_reason: null,
                },
              ],
            })
          );
        } else if (
          event.content_block.type === "web_search_tool_result" ||
          event.content_block.type === "server_tool_use"
        ) {
          // Skip server tool use and web_search_tool_result blocks entirely
          // They represent internal Anthropic operations, not user-defined tools
        }
        break;

      case "content_block_delta":
        if (event.delta.type === "text_delta") {
          // Track content length for annotation positioning
          if (event.delta.text) {
            this.currentContentLength += event.delta.text.length;
          }

          chunks.push(
            this.createChunk({
              choices: [
                {
                  index: 0,
                  delta: { content: event.delta.text },
                  logprobs: null,
                  finish_reason: null,
                },
              ],
            })
          );
        } else if (event.delta.type === "input_json_delta") {
          const toolCall = this.toolCallState.get(event.index);
          if (toolCall) {
            // if we receive any non-empty delta, we know this tool call has non-empty input
            if (event.delta.partial_json !== "") {
              toolCall.hasNonEmptyDelta = true;
            }

            // don't send chunks unless we have non-empty input
            if (toolCall.hasNonEmptyDelta) {
              toolCall.arguments += event.delta.partial_json;

              chunks.push(
                this.createChunk({
                  choices: [
                    {
                      index: 0,
                      delta: {
                        tool_calls: [
                          {
                            index: toolCall.toolCallIndex,
                            id: toolCall.id,
                            type: "function",
                            function: {
                              arguments: event.delta.partial_json,
                            },
                          },
                        ],
                      },
                      logprobs: null,
                      finish_reason: null,
                    },
                  ],
                })
              );
            }
          }
        } else if (event.delta.type === "citations_delta") {
          // Collect citations - will be sent at the end in message_delta
          const citation = event.delta.citation;
          this.annotations.push({
            type: "url_citation",
            url_citation: {
              url: citation.url,
              title: citation.title,
              content: citation.cited_text,
              start_index: 0,
              end_index: this.currentContentLength,
            },
          });
        }
        break;

      case "content_block_stop":
        // handle tool calls with empty arguments
        const toolCall = this.toolCallState.get(event.index);
        if (toolCall && !toolCall.hasNonEmptyDelta) {
          this.emitEmptyToolCallArguments(toolCall, chunks);
        }
        break;

      case "message_delta":
        // if we have any tool calls with empty arguments, emit them with the {} pattern
        this.finalizePendingToolCalls(chunks);

        const cachedTokens = event.usage.cache_read_input_tokens ?? 0;
        const cacheWriteTokens = event.usage.cache_creation_input_tokens ?? 0;
        const webSearchRequests =
          event.usage.server_tool_use?.web_search_requests ?? 0;

        this.finalUsage = {
          prompt_tokens: event.usage.input_tokens,
          completion_tokens: event.usage.output_tokens,
          total_tokens: event.usage.input_tokens + event.usage.output_tokens,
          ...((cachedTokens > 0 || cacheWriteTokens > 0) && {
            prompt_tokens_details: {
              cached_tokens: cachedTokens,
              audio_tokens: 0,

              ...(cacheWriteTokens > 0 && {
                cache_write_tokens: cacheWriteTokens,
                cache_write_details: {
                  write_5m_tokens:
                    event.usage.cache_creation?.ephemeral_5m_input_tokens ?? 0,
                  write_1h_tokens:
                    event.usage.cache_creation?.ephemeral_1h_input_tokens ?? 0,
                },
              }),
            },
          }),
          completion_tokens_details: {
            reasoning_tokens: 0,
            audio_tokens: 0,
            accepted_prediction_tokens: 0,
            rejected_prediction_tokens: 0,
          },
          // AI Gateway extension - only present when converting from Anthropic
          ...(webSearchRequests > 0 && {
            server_tool_use: {
              web_search_requests: webSearchRequests,
            },
          }),
        };

        const finishReason = this.mapStopReason(event.delta.stop_reason);

        chunks.push(
          this.createChunk({
            choices: [
              {
                index: 0,
                delta: {
                  ...(this.annotations.length > 0 && {
                    annotations: this.annotations,
                  }),
                },
                logprobs: null,
                finish_reason: finishReason,
              },
            ],
          })
        );
        break;

      case "message_stop":
        chunks.push(
          this.createChunk({
            choices: [],
            usage: this.finalUsage || undefined,
          })
        );
        break;

      case "ping":
      case "error":
        break;
      default:
        break;
    }

    return chunks;
  }

  private createChunk(
    overrides: Partial<ChatCompletionChunk>
  ): ChatCompletionChunk {
    return {
      id: this.messageId,
      object: "chat.completion.chunk",
      created: this.created,
      model: this.model,
      system_fingerprint: "",
      choices: [],
      ...overrides,
    };
  }

  private mapStopReason(
    reason: string | null
  ): OpenAIStreamChoice["finish_reason"] {
    switch (reason) {
      case "max_tokens":
        return "length";
      case "tool_use":
        return "tool_calls";
      default:
        return "stop";
    }
  }

  private emitEmptyToolCallArguments(
    toolCall: {
      id: string;
      name: string;
      arguments: string;
      toolCallIndex: number;
      hasNonEmptyDelta: boolean;
    },
    chunks: OpenAIStreamEvent[]
  ): void {
    // this was a tool call made with empty arguments, so emit the {} pattern
    // When tools are called with empty args, Anthropic just does nothing
    // OpenAI clients expect something like this: (two chunks, { and } deltas)
    chunks.push(
      this.createChunk({
        choices: [
          {
            index: 0,
            delta: {
              tool_calls: [
                {
                  index: toolCall.toolCallIndex,
                  id: toolCall.id,
                  type: "function",
                  function: {
                    arguments: "{",
                  },
                },
              ],
            },
            logprobs: null,
            finish_reason: null,
          },
        ],
      })
    );

    chunks.push(
      this.createChunk({
        choices: [
          {
            index: 0,
            delta: {
              tool_calls: [
                {
                  index: toolCall.toolCallIndex,
                  id: toolCall.id,
                  type: "function",
                  function: {
                    arguments: "}",
                  },
                },
              ],
            },
            logprobs: null,
            finish_reason: null,
          },
        ],
      })
    );

    toolCall.arguments = "{}";
    toolCall.hasNonEmptyDelta = true; // mark as handled
  }

  private finalizePendingToolCalls(chunks: OpenAIStreamEvent[]): void {
    this.toolCallState.forEach((toolCall) => {
      if (!toolCall.hasNonEmptyDelta) {
        this.emitEmptyToolCallArguments(toolCall, chunks);
      }
    });
  }
}
