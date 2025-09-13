import { 
  Role, 
  OpenAIFinishReason, 
  OpenAIUsage, 
  OpenAIContentBlock, 
  OpenAITool, 
  OpenAIToolChoice, 
  OpenAIToolCall, 
  OpenAIFunctionCall,
  OpenAIStreamingToolCall,
  BaseOpenAIEvent 
} from './common';

// === REQUEST TYPES ===
export interface OpenAIRequestBody {
  model: string;
  messages: OpenAIMessage[];
  functions?: OpenAIFunction[];
  function_call?: "auto" | "none" | { name: string };
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: { [key: string]: number };
  user?: string;
  seed?: number;
  tools?: OpenAITool[];
  tool_choice?: OpenAIToolChoice;
  response_format?: { type: "text" | "json_object" };
}

export interface OpenAIMessage {
  role: Role;
  content: string | null | OpenAIContentBlock[];
  name?: string;
  function_call?: OpenAIFunctionCall;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
}

export interface OpenAIFunction {
  name: string;
  description?: string;
  parameters: object; // JSON Schema object
}

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

export interface OpenAIResponseMessage {
  role: "assistant" | "system" | "user" | "function" | "tool";
  content: string | null;
  function_call?: OpenAIFunctionCall;
  tool_calls?: OpenAIToolCall[];
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
  function_call?: {
    name?: string;
    arguments?: string;
  };
  tool_calls?: OpenAIStreamingToolCall[];
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
  OpenAIContentBlock, 
  OpenAITool, 
  OpenAIToolChoice, 
  OpenAIToolCall, 
  OpenAIFunctionCall,
  OpenAIStreamingToolCall 
} from './common'; 