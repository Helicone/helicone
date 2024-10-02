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
};

export type ILogRequest = {
  model: string;
  [key: string]: any;
};

export interface HeliconeEventTool {
  _type: "tool";
  toolName: string;
  input: string;
  [key: string]: any;
}

export interface HeliconeEventVectorDB {
  _type: "vector_db";
  operation: "search" | "insert" | "delete" | "update";
  text?: string;
  vector?: number[];
  topK?: number;
  filter?: object;
  [key: string]: any;
  databaseName?: string;
}

export type HeliconeCustomEventRequest = HeliconeEventTool | HeliconeEventVectorDB;

export type HeliconeLogRequest = ILogRequest | HeliconeCustomEventRequest;