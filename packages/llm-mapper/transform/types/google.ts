import { HeliconeChatCreateParams } from "../../../prompts/types";

// === REQUEST TYPES ===
export type GeminiPart = {
  text?: string;
  inlineData?: {
    mimeType?: string;
    data: string;
  };
  fileData?: {
    fileUri: string;
  };
  functionCall?: {
    name?: string;
    args?: Record<string, any>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, any>;
  };
};

export type GeminiContent = {
  role: "user" | "model" | "system";
  parts: GeminiPart[];
};

export type GeminiTool = {
  functionDeclarations: Array<{
    name: string;
    description?: string;
    parameters?: Record<string, any>;
  }>;
};

export type GeminiThinkingConfig = {
  includeThoughts?: boolean;
  thinkingLevel?: "low" | "high";
  thinkingBudget?: number;
};

export type GeminiGenerationConfig = {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
  candidateCount?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  thinkingConfig?: GeminiThinkingConfig;
};

export type GeminiToolConfig = {
  function_calling_config: {
    mode: "AUTO" | "ANY" | "NONE";
    allowed_function_names?: string[];
  };
};

export interface GeminiGenerateContentRequest {
  contents: GeminiContent[];
  system_instruction?: GeminiContent;
  generationConfig?: GeminiGenerationConfig;
  tools?: GeminiTool[];
  toolConfig?: GeminiToolConfig;
}

export type ChatCompletionMessage =
  NonNullable<HeliconeChatCreateParams["messages"]>[number];

export type ExtendedHeliconeChatCreateParams = HeliconeChatCreateParams & {
  max_output_tokens?: number | null;
  top_k?: number | null;
};

/**
 * Extended reasoning options for Google-specific thinking configuration.
 */
export interface GoogleReasoningOptions {
  /** Token budget for thinking (Gemini 2.5 models) */
  budget_tokens?: number;
  /** Thinking level (Gemini 3+ models) */
  thinking_level?: "low" | "high";
}
// === RESPONSE TYPES ===
export interface GoogleFunctionCall {
  name?: string;
  args?: Record<string, any>;
}

export interface GoogleContentPart {
  text?: string;
  thought?: boolean;
  functionCall?: GoogleFunctionCall;
  inlineData?: {
    mimeType?: string;
    data: string;
  };
  thoughtSignature?: string;
}

export interface GoogleContent {
  role?: string;
  parts?: GoogleContentPart[] | GoogleContentPart;
}

export interface GoogleCandidate {
  content?: GoogleContent | GoogleContent[];
  finishReason?: string;
  index?: number;
}

export interface GoogleTokenDetail {
  modality: "MODALITY_UNSPECIFIED" | "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
  tokenCount: number;
}

export interface GoogleUsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount?: number;
  totalTokenCount: number;
  toolUsePromptTokenCount?: number;
  thoughtsTokenCount?: number;
  cachedContentTokenCount?: number;
  promptTokenDetails?: GoogleTokenDetail[];
  promptTokensDetails?: GoogleTokenDetail[]; // Some responses use pluralized key
  cacheTokenDetails?: GoogleTokenDetail[];
  candidatesTokensDetails?: GoogleTokenDetail[];
  toolUsePromptTokensDetails?: GoogleTokenDetail[];
  trafficType?: 'TRAFFIC_TYPE_UNSPECIFIED' | 'ON_DEMAND' | 'PROVISIONED_THROUGHPUT';
}

export interface GoogleResponseBody {
  candidates: GoogleCandidate[];
  modelVersion: string;
  usageMetadata: GoogleUsageMetadata;
  responseId: string;
  name: string;
}

export type GoogleStreamEvent = GoogleResponseBody;

/**
 * Google Gemini Thinking configuration for reasoning/thinking models.
 * @see https://ai.google.dev/gemini-api/docs/thinking
 */
export interface GoogleThinkingConfig {
  /** Whether to include thinking/reasoning summaries in the response */
  includeThoughts?: boolean;
  /**
   * Thinking level for Gemini 3+ models
   * - "low" for faster, less detailed reasoning
   * - "high" for more detailed reasoning
   */
  thinkingLevel?: "low" | "high";
  /**
   * Token budget for thinking (for Gemini 2.5 models)
   * - Specific token values (e.g., 1024)
   * - -1 for dynamic thinking
   * - 0 to disable thinking
   */
  thinkingBudget?: number;
}
