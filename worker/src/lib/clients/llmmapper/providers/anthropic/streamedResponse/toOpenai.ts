import { AnthropicStreamEvent } from "../../../types";
import {
  OpenAIStreamEvent,
  ChatCompletionChunk,
  OpenAIStreamChoice,
} from "../../../types";

export class AnthropicToOpenAIStreamConverter {
  private messageId: string = "";
  private model: string = "";
  private created: number = 0;
  private finalUsage: ChatCompletionChunk["usage"] | null = null;
  private toolCallState: Map<number, { id: string; name: string; arguments: string; toolCallIndex: number; hasNonEmptyDelta: boolean }> = new Map();
  private nextToolCallIndex: number = 0;

  constructor() {
    this.created = Math.floor(Date.now() / 1000);
  }

  convert(event: AnthropicStreamEvent): OpenAIStreamEvent[] {
    const chunks: OpenAIStreamEvent[] = [];

    switch (event.type) {
      case "message_start":
        this.messageId = event.message.id;
        this.model = event.message.model;
        this.toolCallState.clear();
        this.nextToolCallIndex = 0;
        
        chunks.push(this.createChunk({
          choices: [{
            index: 0,
            delta: { 
              role: "assistant",
              content: ""
            },
            logprobs: null,
            finish_reason: null,
          }]
        }));
        break;

      case "content_block_start":
        if (event.content_block.type === "tool_use") {
          // Store tool call metadata and emit the initial tool call chunk
          const toolCall = {
            id: event.content_block.id || "",
            name: event.content_block.name || "",
            arguments: "{}",
            toolCallIndex: this.nextToolCallIndex++,
            hasNonEmptyDelta: false
          };
          this.toolCallState.set(event.index, toolCall);

          chunks.push(this.createChunk({
            choices: [{
              index: 0,
              delta: {
                tool_calls: [{
                  index: toolCall.toolCallIndex,
                  id: toolCall.id,
                  type: "function",
                  function: {
                    name: toolCall.name,
                    arguments: ""
                  }
                }]
              },
              logprobs: null,
              finish_reason: null,
            }]
          }));
        }
        break;

      case "content_block_delta":
        if (event.delta.type === "text_delta") {
          chunks.push(this.createChunk({
            choices: [{
              index: 0,
              delta: { content: event.delta.text },
              logprobs: null,
              finish_reason: null,
            }]
          }));
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
              
              chunks.push(this.createChunk({
                choices: [{
                  index: 0,
                  delta: {
                    tool_calls: [{
                      index: toolCall.toolCallIndex,
                      id: toolCall.id,
                      type: "function",
                      function: {
                        arguments: event.delta.partial_json
                      }
                    }]
                  },
                  logprobs: null,
                  finish_reason: null,
                }]
              }));
            }
          }
        }
        break;

      case "content_block_stop":
        // handle tool calls with empty arguments
        const toolCall = this.toolCallState.get(event.index);
        console.log("content_block_stop", toolCall);
        if (toolCall && !toolCall.hasNonEmptyDelta) {
          this.emitEmptyToolCallArguments(toolCall, chunks);
        }
        break;

      case "message_delta":
        // if we have any tool calls with empty arguments, emit them with the {} pattern
        this.finalizePendingToolCalls(chunks);
        
        const cachedTokens = event.usage.cache_read_input_tokens ?? 0;

        this.finalUsage = {
          prompt_tokens: event.usage.input_tokens,
          completion_tokens: event.usage.output_tokens,
          total_tokens: event.usage.input_tokens + event.usage.output_tokens,
          ...(cachedTokens > 0 && {
            prompt_tokens_details: {
              cached_tokens: cachedTokens,
              audio_tokens: 0,
            }
          }),
          completion_tokens_details: {
            reasoning_tokens: 0,
            audio_tokens: 0,
            accepted_prediction_tokens: 0,
            rejected_prediction_tokens: 0,
          },
        };

        const finishReason = this.mapStopReason(event.delta.stop_reason);
        
        chunks.push(this.createChunk({
          choices: [{
            index: 0,
            delta: {},
            logprobs: null,
            finish_reason: finishReason,
          }]
        }));
        break;

      case "message_stop":
        chunks.push(this.createChunk({
          choices: [],
          usage: this.finalUsage || undefined
        }));
        break;

      case "ping":
      case "error":
        break;
      default:
        break;
    }

    return chunks;
  }

  private createChunk(overrides: Partial<ChatCompletionChunk>): ChatCompletionChunk {
    return {
      id: this.messageId,
      object: "chat.completion.chunk",
      created: this.created,
      model: this.model,
      system_fingerprint: "",
      choices: [],
      ...overrides
    };
  }

  private mapStopReason(reason: string | null): OpenAIStreamChoice["finish_reason"] {
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
    toolCall: { id: string; name: string; arguments: string; toolCallIndex: number; hasNonEmptyDelta: boolean }, 
    chunks: OpenAIStreamEvent[]
  ): void {
    // this was a tool call made with empty arguments, so emit the {} pattern
    // When tools are called with empty args, Anthropic just does nothing
    // OpenAI clients expect something like this: (two chunks, { and } deltas)
    chunks.push(this.createChunk({
      choices: [{
        index: 0,
        delta: {
          tool_calls: [{
            index: toolCall.toolCallIndex,
            id: toolCall.id,
            type: "function",
            function: {
              arguments: "{"
            }
          }]
        },
        logprobs: null,
        finish_reason: null,
      }]
    }));
    
    chunks.push(this.createChunk({
      choices: [{
        index: 0,
        delta: {
          tool_calls: [{
            index: toolCall.toolCallIndex,
            id: toolCall.id,
            type: "function",
            function: {
              arguments: "}"
            }
          }]
        },
        logprobs: null,
        finish_reason: null,
      }]
    }));
    
    toolCall.arguments = "{}";
    toolCall.hasNonEmptyDelta = true; // mark as handled
  }

  private finalizePendingToolCalls(chunks: OpenAIStreamEvent[]): void {
    for (const [index, toolCall] of this.toolCallState.entries()) {
      if (!toolCall.hasNonEmptyDelta) {
        this.emitEmptyToolCallArguments(toolCall, chunks);
      }
    }
  }
}
