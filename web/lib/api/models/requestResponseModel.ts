export type LlmType = "chat" | "completion";

interface RequestMessage {
  role?: string;
  content?: string;
  tool_call_id?: string;
}

interface ResponseMessage {
  role?: string;
  content?: string;
  tool_calls?: ToolCall[];
}

interface ToolCall {
  id: string;
  type: string;
  function: Function;
}

interface Function {
  name: string;
  arguments: string;
  description?: string;
}

interface Tool {
  type: string;
  function: Function;
}

interface Request {
  llm_type?: LlmType;
  model?: string;
  provider?: string;
  prompt?: string | null;
  max_tokens?: number | null;
  temperature?: number | null;
  top_p?: number | null;
  n?: number | null;
  stream?: boolean | null;
  stop?: string | null;
  presence_penalty?: number | null;
  frequency_penalty?: number | null;
  logprobs?: number | null;
  best_of?: number | null;
  logit_bias?: object | null;
  user?: string | null;
  tools?: Tool[];
  messages?: RequestMessage[] | null;
  // Truncated state fields
  tooLarge?: boolean;
  heliconeMessage?: string;
}

interface Completion {
  [index: number]: string;
}

interface ErrorInfo {
  code?: string | null;
  message?: string | null;
}

interface Response {
  completions?: Completion[] | null;
  message?: ResponseMessage | null;
  error?: ErrorInfo | null;
  model?: string | null;
  // Truncated state fields
  tooLarge?: boolean;
  heliconeMessage?: string;
}

export interface LlmSchema {
  request: Request;
  response?: Response | null;
}
