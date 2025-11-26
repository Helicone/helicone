// Common types used across different providers
import { CacheControl } from "@helicone-package/prompts/types";

// Role types
export type Role = "system" | "user" | "assistant" | "function" | "tool";

// Stop/Finish reasons
export type AnthropicStopReason =
  | "end_turn"
  | "max_tokens"
  | "stop_sequence"
  | "tool_use"
  | "pause_turn"
  | "refusal"
  | null;
export type OpenAIFinishReason =
  | "stop"
  | "length"
  | "function_call"
  | "content_filter"
  | "tool_calls"
  | null;

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
  // Including cached and audio tokens
  prompt_tokens: number;
  // Including reasoning and audio tokens
  completion_tokens: number;
  // prompt_tokens + completion_tokens
  total_tokens: number;
  prompt_tokens_details?: {
    cached_tokens?: number;
    audio_tokens?: number;

    // AI Gateway only
    cache_write_tokens?: number;
    cache_write_details?: {
      write_5m_tokens?: number;
      write_1h_tokens?: number;
    };
  };
  completion_tokens_details?: {
    reasoning_tokens?: number;
    audio_tokens?: number;
    accepted_prediction_tokens?: number;
    rejected_prediction_tokens?: number;
  };

  // AI Gateway only - when cost calculation upfront is possible
  cost?: number;
}

// Content block types (shared between Anthropic request and response)
export interface AnthropicContentBlock {
  type:
  | "text"
  | "image"
  | "document"
  | "tool_use"
  | "tool_result"
  | "thinking"
  | "server_tool_use"
  | "web_search_tool_result";
  text?: string;
  // Image and Document fields
  source?:
  | {
    type: "base64";
    media_type: string;
    data: string;
  }
  | {
    type: "url";
    url: string;
  }
  | {
    type: "text";
    media_type: string;
    data: string;
  };
  // Document fields
  title?: string;
  // Tool use fields
  id?: string;
  name?: string;
  input?: Record<string, any>;
  // Tool result fields
  tool_use_id?: string;
  content?: string | WebSearchResult[] | WebSearchError;
  // Thinking fields
  thinking?: string;
  signature?: string;
  // Text citations (for web search responses) OR document citation config (for document requests)
  citations?: WebSearchCitation[] | { enabled: boolean };
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

// Web search tool definition
export interface AnthropicWebSearchTool {
  type: "web_search_20250305";
  name: "web_search";
  max_uses?: number;
  allowed_domains?: string[];
  blocked_domains?: string[];
  user_location?: {
    type?: "approximate";
    city?: string;
    region?: string;
    country?: string;
    timezone?: string;
  };
}

export interface WebSearchResult {
  type: "web_search_result";
  url: string;
  title: string;
  encrypted_content: string;
  page_age?: string;
}

export interface WebSearchError {
  type: "web_search_tool_result_error";
  error_code: string;
}

export interface WebSearchCitation {
  type: "web_search_result_location";
  url: string;
  title: string;
  encrypted_index: string;
  cited_text: string;
}

// Tool choice types
export type AnthropicToolChoice =
  | { type: "auto" }
  | { type: "any" }
  | { type: "tool"; name: string };

export type OpenAIToolChoice =
  | "auto"
  | "none"
  | { type: string; function: { name: string } };

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
