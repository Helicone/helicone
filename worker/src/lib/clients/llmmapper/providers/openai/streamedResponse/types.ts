// Base event type
export interface BaseEvent {
  object: "chat.completion.chunk";
}

// Chat completion chunk
export interface ChatCompletionChunk extends BaseEvent {
  id: string;
  created: number;
  model: string;
  system_fingerprint: string;
  choices: Choice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Choice object
export interface Choice {
  index: number;
  delta: Delta;
  logprobs: null | LogProbs;
  finish_reason:
    | "stop"
    | "length"
    | "function_call"
    | "content_filter"
    | "tool_calls"
    | null;
}

// Delta object
export interface Delta {
  role?: "system" | "user" | "assistant" | "function" | "tool";
  content?: string;
  function_call?: {
    name?: string;
    arguments?: string;
  };
  tool_calls?: ToolCall[];
}

// Tool Call object
export interface ToolCall {
  index: number;
  id: string;
  type: "function";
  function: {
    name?: string;
    arguments?: string;
  };
}

// LogProbs object (if needed in the future)
export interface LogProbs {
  content?: LogProbContent[];
  function_call?: LogProbFunctionCall;
}

export interface LogProbContent {
  token: string;
  logprob: number;
  bytes: number[];
  top_logprobs: { [token: string]: number };
}

export interface LogProbFunctionCall {
  name: LogProbContent[];
  arguments: LogProbContent[];
}

// Union type for all possible events
export type OpenAIStreamEvent = ChatCompletionChunk;
