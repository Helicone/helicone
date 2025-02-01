import { ProviderName } from "../cost/providers/mappings";

export type Provider = ProviderName | "CUSTOM";

export type LlmType = "chat" | "completion";

export type Message = {
  id?: string;
  role?: string;
  content?: string;
  tool_calls?: FunctionCall[];
  tool_call_id?: string;
  _type: "function" | "functionCall" | "image" | "message" | "autoInput";
  image_url?: string;
};

export type PromptMessage = Message | string;

export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

interface LLMRequestBody {
  llm_type?: LlmType;
  model?: string;
  provider?: string;
  prompt?: string | null;
  input?: string | string[];
  max_tokens?: number | null;
  temperature?: number | null;
  top_p?: number | null;
  stream?: boolean | null;
  presence_penalty?: number | null;
  frequency_penalty?: number | null;
  n?: number | null;
  stop?: string[] | null;
  messages?: Message[] | null;
  tool_choice?: any;
}

type LLMResponseBody = {
  messages?: Message[] | null;
  model?: string | null;
  error?: {
    heliconeMessage: any;
  };
};

export interface LlmSchema {
  request: LLMRequestBody;
  response?: LLMResponseBody | null;
}

export type LLMPreview = {
  request: string;
  response: string;
  concatenatedMessages: Message[];
};

export type MapperType =
  | "openai-chat"
  | "anthropic-chat"
  | "gemini-chat"
  | "black-forest-labs-image"
  | "openai-assistant"
  | "openai-image"
  | "openai-moderation"
  | "openai-embedding"
  | "openai-instruct"
  | "vector-db"
  | "tool"
  | "unknown";

type HeliconeMetadata = {
  requestId: string;
  path: string;
  countryCode: string | null;
  createdAt: string;
  totalTokens: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  latency: number | null;
  user: string | null;
  status: {
    code: number;
    statusType: "success" | "error" | "pending" | "unknown" | "cached";
  };
  customProperties: {
    [key: string]: any;
  } | null;
  cost: number | null;
  feedback: {
    createdAt: string | null;
    id: string | null;
    rating: boolean | null;
  };
  provider: Provider;
  timeToFirstToken?: number | null;
  scores?: Record<string, { value: number; valueType: string } | number> | null;
};

export type MappedLLMRequest = {
  _type: MapperType;
  id: string;
  schema: LlmSchema;
  preview: LLMPreview;
  model: string;
  raw: {
    request: any;
    response: any;
  };
  heliconeMetadata: HeliconeMetadata;
};
export type HeliconeErrorType = {
  error: {
    heliconeMessage: string;
  };
};

export interface HeliconeRequest {
  response_id: string | null;
  response_created_at: string | null;
  response_body?: any;
  response_status: number;
  response_model: string | null;
  request_id: string;
  request_created_at: string;
  request_body: any;
  request_path: string;
  request_user_id: string | null;
  request_properties: Record<string, string> | null;
  request_model: string | null;
  model_override: string | null;
  helicone_user: string | null;
  provider: Provider;
  delay_ms: number | null;
  time_to_first_token: number | null;
  total_tokens: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  prompt_id: string | null;
  feedback_created_at?: string | null;
  feedback_id?: string | null;
  feedback_rating?: boolean | null;
  signed_body_url?: string | null;
  llmSchema: LlmSchema | null;
  country_code: string | null;
  asset_ids: string[] | null;
  asset_urls: Record<string, string> | null;
  scores: Record<string, number> | null;
  costUSD?: number | null;
  properties: Record<string, string>;
  assets: Array<string>;
  target_url: string;
  model: string;
}
