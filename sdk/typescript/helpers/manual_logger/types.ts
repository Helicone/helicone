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
  textBody?: string;
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
  timeToFirstToken?: number;
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
