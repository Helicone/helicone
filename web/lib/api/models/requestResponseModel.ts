export type LlmType = "chat" | "completion";

interface Message {
  role?: string;
  content?: string;
  function_name?: string;
  function_arguments?: object;
}

interface Request {
  llm_type: LlmType;
  model: string;
  provider: string;
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
  messages?: Message[] | null;
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
  message?: Message | null;
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
