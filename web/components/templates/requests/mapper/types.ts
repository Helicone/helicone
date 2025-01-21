import { Provider } from "@/lib/api/request/request";
import { Json } from "@/supabase/database.types";

export type LlmType = "chat" | "completion";

export type Message = {
  id?: string;
  role?: string;
  content?: string;
  tool_calls?: FunctionCall[];
  _type: "function" | "functionCall" | "image" | "message" | "autoInput";
  image_url?: string;
};

interface FunctionCall {
  name?: string;
  arguments?: object;
}

interface LLMRequestBody {
  llm_type?: LlmType;
  model?: string;
  provider?: string;
  prompt?: string | null;
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
    [key: string]: Json;
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
