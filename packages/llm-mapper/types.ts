import { ProviderName } from "../cost/providers/mappings";

export type Provider = ProviderName | "CUSTOM";

export type LlmType = "chat" | "completion";

export type Message = {
  _type:
    | "functionCall" // The request for a function call: function (openai) or tool_use (anthropic)
    | "function" // The result of a function call to give: tool (openai) or tool_result (anthropic)
    | "image"
    | "message"
    | "autoInput"
    | "contentArray"
    | "audio";
  id?: string;
  role?: string;
  name?: string;
  content?: string;
  tool_calls?: FunctionCall[]; // only used if _type is functionCall
  tool_call_id?: string;
  timestamp?: string; // TODO: Remove when sessions have this data?
  image_url?: string;
  audio_data?: string; // Base64 encoded audio data
  idx?: number; // Index of an auto prompt input message
  contentArray?: Message[];
};

export type PromptMessage = Message | string;

export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

export interface Tool {
  name: string;
  description: string;
  parameters?: Record<string, any>; // Used for both OpenAI parameters and Anthropic input_schema
}

// Tool-specific types
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

export interface LLMRequestBody {
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
  reasoning_effort?: "low" | "medium" | "high" | null;
  n?: number | null;
  stop?: string[] | null;
  messages?: Message[] | null;
  tools?: Tool[];
  tool_choice?: {
    // Anthropic only
    type: "auto" | "none" | "tool";
    name?: string;
  };
  // Tool-specific fields

  toolDetails?: HeliconeEventTool;
  vectorDBDetails?: HeliconeEventVectorDB;
}

type LLMResponseBody = {
  messages?: Message[] | null;
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

export interface LlmSchema {
  request: LLMRequestBody;
  response?: LLMResponseBody | null;
}

export type LLMPreview = {
  fullRequestText?: () => string;
  fullResponseText?: () => string;
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
  | "openai-realtime"
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
  prompt_cache_write_tokens: number | null;
  prompt_cache_read_tokens: number | null;
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
