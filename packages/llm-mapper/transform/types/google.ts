export interface GoogleFunctionCall {
  name?: string;
  args?: Record<string, any>;
}

export interface GoogleContentPart {
  text?: string;
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
