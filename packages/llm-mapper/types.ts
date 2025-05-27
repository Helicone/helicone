import { ProviderName } from "@helicone-package/cost/providers/mappings";

export const DEFAULT_UUID = "00000000-0000-0000-0000-000000000000";

export type MapperType =
  | "openai-chat"
  | "openai-response"
  | "anthropic-chat"
  | "gemini-chat"
  | "black-forest-labs-image"
  | "openai-assistant"
  | "openai-image"
  | "openai-moderation"
  | "openai-embedding"
  | "openai-instruct"
  | "openai-realtime"
  | "vector-db"
  | "tool"
  | "unknown";

export type Provider = ProviderName | "CUSTOM";
export type LlmType = "chat" | "completion";

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

export interface LlmSchema {
  request: LLMRequestBody;
  response?: LLMResponseBody | null;
}

export type LLMPreview = {
  fullRequestText?: (preview?: boolean) => string;
  fullResponseText?: (preview?: boolean) => string;
  request: string;
  response: string;
  concatenatedMessages: Message[];
};

export interface LLMRequestBody {
  llm_type?: LlmType;
  provider?: string;
  model?: string;
  messages?: Message[] | null;
  prompt?: string | null;
  instructions?: string | null;
  max_tokens?: number | null;
  temperature?: number | null;
  top_p?: number | null;
  seed?: number | null;
  stream?: boolean | null;
  presence_penalty?: number | null;
  frequency_penalty?: number | null;
  stop?: string[] | string | null;
  reasoning_effort?: "low" | "medium" | "high" | null;
  tools?: Tool[];
  parallel_tool_calls?: boolean | null;
  tool_choice?: {
    type: "none" | "auto" | "any" | "tool";
    name?: string;
  };
  response_format?: { type: string; json_schema?: any };
  toolDetails?: HeliconeEventTool;
  vectorDBDetails?: HeliconeEventVectorDB;
  input?: string | string[];
  n?: number | null;
  size?: string;
  quality?: string;
}

type LLMResponseBody = {
  messages?: Message[] | null;
  responses?: Response[] | null;
  instructions?: string | null;
  model?: string | null;
  error?: {
    heliconeMessage: any;
  };
  toolDetailsResponse?: {
    status: string;
    message: string;
    tips: string[];
    metadata: {
      timestamp: string;
    };
    _type: "tool";
    toolName: string;
  };
  vectorDBDetailsResponse?: {
    status: string;
    message: string;
    similarityThreshold?: number;
    actualSimilarity?: number;
    metadata: {
      destination?: string;
      destination_parsed?: boolean;
      timestamp: string;
    };
    _type: "vector_db";
  };
};

export type Message = {
  _type:
    | "functionCall"
    | "function"
    | "image"
    | "file"
    | "message"
    | "autoInput"
    | "contentArray"
    | "audio";
  id?: string;
  role?: string | "user" | "assistant" | "system" | "developer";
  instruction?: string;
  name?: string;
  content?: string;
  mime_type?: string;
  tool_calls?: FunctionCall[];
  tool_call_id?: string;
  timestamp?: string;
  image_url?: string;
  audio_data?: string;
  type?: "input_image" | "input_text" | "input_file";
  file_data?: string;
  file_id?: string;
  filename?: string;
  detail?: string;
  idx?: number;
  contentArray?: Message[];
  deleted?: boolean;
  start_timestamp?: string;
  trigger_event_id?: string;
  ending_event_id?: string;
};

export type Response = {
  _type:
    | "functionCall"
    | "function"
    | "image"
    | "text"
    | "file"
    | "contentArray";
  id?: string;
  role: "user" | "assistant" | "system" | "developer";
  name?: string;
  type: "input_image" | "input_text" | "input_file";
  text?: string | undefined;
  tool_calls?: FunctionCall[];
  tool_call_id?: string;
  timestamp?: string;
  image_url?: string;
  audio_data?: string;
  idx?: number;
  file_data?: string;
  file_id?: string;
  filename?: string;
  detail?: string;
  contentArray?: Response[];
};

export interface Tool {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

type HeliconeMetadata = {
  requestId: string;
  path: string;
  countryCode: string | null;
  cacheEnabled: boolean;
  cacheReferenceId: string | null;
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

export type PromptMessage = Message | string;

export type HeliconeErrorType = {
  error: {
    heliconeMessage: string;
  };
};

export type ProviderRequest = {
  url: string;
  json: {
    [key: string]: any;
  };
  meta: Record<string, string>;
};

export type ProviderResponse = {
  json: {
    [key: string]: any;
  };
  status: number;
  headers: Record<string, string>;
};

export type Timing = {
  startTime: {
    seconds: number;
    milliseconds: number;
  };
  endTime: {
    seconds: number;
    milliseconds: number;
  };
};

export type IHeliconeManualLogger = {
  apiKey: string;
  headers?: Record<string, string>;
  loggingEndpoint?: string;
};

export type ILogRequest = {
  model: string;
  [key: string]: any;
};

export interface HeliconeEventTool {
  _type: "tool";
  toolName: string;
  input: any;
  [key: string]: any;
}

export interface HeliconeEventVectorDB {
  _type: "vector_db";
  operation: "search" | "insert" | "delete" | "update";
  text?: string;
  vector?: number[];
  topK?: number;
  filter?: object;
  databaseName?: string;
  [key: string]: any;
}

export type HeliconeCustomEventRequest =
  | HeliconeEventTool
  | HeliconeEventVectorDB;

export type HeliconeLogRequest = ILogRequest | HeliconeCustomEventRequest;

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
  prompt_cache_write_tokens: number | null;
  prompt_cache_read_tokens: number | null;
  completion_tokens: number | null;
  prompt_audio_tokens: number | null;
  completion_audio_tokens: number | null;
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
  cache_reference_id: string | null;
  cache_enabled: boolean;
}
