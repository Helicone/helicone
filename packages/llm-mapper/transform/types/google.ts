export interface GoogleContentPart {
  text?: string;
  functionCall?: {
    name?: string;
    args?: Record<string, any>;
  };
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

export interface GoogleUsageMetadata {
  promptTokenCount?: number;
  promptTokens?: number;
  candidatesTokenCount?: number;
  candidatesTokens?: number;
  totalTokenCount?: number;
}

export interface GoogleResponseBody {
  candidates?: GoogleCandidate[];
  modelVersion?: string;
  usageMetadata?: GoogleUsageMetadata;
  responseId?: string;
  name?: string;
}

export type GoogleStreamEvent = GoogleResponseBody;
