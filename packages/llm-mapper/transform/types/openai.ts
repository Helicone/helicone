import {
  Role,
  OpenAIFinishReason,
  OpenAIUsage,
  OpenAIToolCall,
  OpenAIFunctionCall,
  OpenAIStreamingToolCall,
  BaseOpenAIEvent,
} from "./common";

// === RESPONSE TYPES ===
export interface OpenAIResponseBody {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: OpenAIUsage;
  system_fingerprint?: string;
}

export interface OpenAIChoice {
  index: number;
  message: OpenAIResponseMessage;
  finish_reason: OpenAIFinishReason;
  logprobs: null | OpenAILogProbs;
}

export interface OpenAIReasoningDetail {
  thinking: string;
  signature: string;
}

export interface OpenAIResponseMessage {
  role: "assistant" | "system" | "user" | "function" | "tool";
  content: string | null;
  reasoning?: string;
  reasoning_details?: OpenAIReasoningDetail[];
  function_call?: OpenAIFunctionCall;
  tool_calls?: OpenAIToolCall[];
  annotations?: OpenAIAnnotation[];
}

export interface OpenAIAnnotation {
  type: "url_citation";
  url_citation: {
    url: string;
    title: string;
    content?: string;
    start_index: number;
    end_index: number;
  };
}

// === STREAMING TYPES ===
export interface ChatCompletionChunk extends BaseOpenAIEvent {
  id: string;
  created: number;
  model: string;
  system_fingerprint: string;
  choices: OpenAIStreamChoice[];
  usage?: OpenAIUsage;
}

export interface OpenAIStreamChoice {
  index: number;
  delta: OpenAIDelta;
  logprobs: null | OpenAILogProbs;
  finish_reason: OpenAIFinishReason;
}

export interface OpenAIDelta {
  role?: Role;
  content?: string;
  reasoning?: string;
  reasoning_details?: OpenAIReasoningDetail[];
  function_call?: {
    name?: string;
    arguments?: string;
  };
  tool_calls?: OpenAIStreamingToolCall[];
  annotations?: OpenAIAnnotation[];
}

// === LOGPROBS TYPES ===
export interface OpenAILogProbs {
  content?: OpenAILogProbContent[];
  function_call?: OpenAILogProbFunctionCall;
}

export interface OpenAILogProbContent {
  token: string;
  logprob: number;
  bytes: number[];
  top_logprobs: { [token: string]: number };
}

export interface OpenAILogProbFunctionCall {
  name: OpenAILogProbContent[];
  arguments: OpenAILogProbContent[];
}

// Union type for streaming events
export type OpenAIStreamEvent = ChatCompletionChunk;

// Re-export common types for convenience
export type {
  OpenAIFinishReason,
  OpenAIUsage,
  OpenAIToolChoice,
  OpenAIToolCall,
  OpenAIFunctionCall,
  OpenAIStreamingToolCall,
} from "./common";
