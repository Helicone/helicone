export interface GoogleFunctionCall {
  name?: string;
  args?: Record<string, any>;
}

export interface GoogleContentPart {
  text?: string;
  thought?: boolean;
  functionCall?: GoogleFunctionCall;
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
