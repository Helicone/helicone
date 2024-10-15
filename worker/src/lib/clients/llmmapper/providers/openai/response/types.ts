export interface OpenAIResponseBody {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
  system_fingerprint?: string;
}

export interface Choice {
  index: number;
  message: Message;
  finish_reason:
    | "stop"
    | "length"
    | "function_call"
    | "content_filter"
    | "tool_calls"
    | null;
  logprobs: null | {
    content?: LogProbs[];
    function_call?: LogProbs;
    token_logprobs: number[];
    top_logprobs: { [token: string]: number }[];
    text_offset: number[];
  };
}

export interface Message {
  role: "assistant" | "system" | "user" | "function" | "tool";
  content: string | null;
  function_call?: FunctionCall;
  tool_calls?: ToolCall[];
}

export interface FunctionCall {
  name: string;
  arguments: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: FunctionCall;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface LogProbs {
  token_logprobs: number[];
  top_logprobs: { [token: string]: number }[];
  text_offset: number[];
}
