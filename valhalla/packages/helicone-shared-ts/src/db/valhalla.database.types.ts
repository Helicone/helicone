export interface ValhallaRequest {
  id: string; // uuid
  createdAt: Date; // timestamp with time zone
  body: any; // jsonb
  urlHref: string; // text
  userId: string | null; // text, nullable
  properties: any | null; // jsonb, nullable
  heliconeApiKeyID: bigint | null; // bigint, nullable
  heliconeOrgID: string | null; // uuid, nullable
  provider: string; // text with default value 'OPENAI'
  heliconeProxyKeyID: string | null; // uuid, nullable
}

export interface ValhallaResponse {
  id: string; // uuid
  createdAt: Date; // timestamp with time zone
  body: any; // jsonb
  request: string; // uuid (foreign key to Request)
  delayMs: number | null; // integer, nullable
  http_status: number | null; // smallint, nullable
  completionTokens: number | null; // integer, nullable
  model: string | null; // text, nullable
  promptTokens: number | null; // integer, nullable
}

export interface ValhallaCacheHits {
  createdAt: Date; // timestamp with time zone
  requestID: string; // uuid (foreign key to Request)
}

export interface ValhallaFeedback {
  responseID: string; // uuid (foreign key to Response)
  rating: boolean; // boolean
  createdAt: Date; // timestamp with time zone
  id: string; // uuid
}
