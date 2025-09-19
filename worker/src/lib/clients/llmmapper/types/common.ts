// Common types used across different providers
import { CacheControl } from "@helicone-package/prompts/types";

// Role types
export type Role = "system" | "user" | "assistant" | "function" | "tool";

// Stop/Finish reasons
export type AnthropicStopReason = "end_turn" | "max_tokens" | "stop_sequence" | "tool_use" | "pause_turn" | "refusal" | null;
export type OpenAIFinishReason = "stop" | "length" | "function_call" | "content_filter" | "tool_calls" | null;

// Usage types for Anthropic (shared across request, response, and streaming)
export interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation?: {
    ephemeral_5m_input_tokens?: number;
    ephemeral_1h_input_tokens?: number;
  };
  server_tool_use?: {
    web_search_requests?: number;
  };
  service_tier?: string;
}

// OpenAI usage types
export interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details?: {
    cached_tokens?: number;
    audio_tokens?: number;
  };
  completion_tokens_details?: {
    reasoning_tokens?: number;
    audio_tokens?: number;
    accepted_prediction_tokens?: number;
    rejected_prediction_tokens?: number;
  };
}

// Content block types (shared between Anthropic request and response)
export interface AnthropicContentBlock {
  type: "text" | "image" | "tool_use" | "tool_result" | "thinking" | "server_tool_use";
  text?: string;
  // Image fields
  source?: 
    | {
        type: "base64";
        media_type: string;
        data: string;
      }
    | {
        type: "url";
        url: string;
      };
  // Tool use fields
  id?: string;
  name?: string;
  input?: Record<string, any>;
  // Tool result fields
  tool_use_id?: string;
  content?: string;
  // Thinking fields
  thinking?: string;
  signature?: string;
  cache_control?: CacheControl;
}

// Tool definitions
export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

// Tool choice types
export type AnthropicToolChoice = 
  | { type: "auto" }
  | { type: "any" }
  | { type: "tool"; name: string };

export type OpenAIToolChoice = "auto" | "none" | { type: string; function: { name: string } };

// Tool call types
export interface OpenAIToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

// Function call (legacy OpenAI)
export interface OpenAIFunctionCall {
  name: string;
  arguments: string;
}

// Delta types for streaming
export interface OpenAIStreamingToolCall {
  index: number;
  id: string;
  type: "function";
  function: {
    name?: string;
    arguments?: string;
  };
}

// Base event interfaces
export interface BaseStreamEvent {
  type: string;
}

export interface BaseOpenAIEvent {
  object: "chat.completion.chunk";
} 