export class HeliconeManualLogger {
  private apiKey: string;
  private headers: Record<string, string>;
  private request: ILogRequest | HeliconeCustomEventRequest | null = null;

  private startTime: number;
  private endTime: number | null = null;

  private readonly LOGGING_ENDPOINT: string =
    // "http://127.0.0.1:8788/custom/v1/log";
    "https://api.hconeai.com/custom/v1/log";

  constructor(opts: IHeliconeManualLogger) {
    this.apiKey = opts.apiKey;
    this.headers = opts.headers || {};
    this.startTime = Date.now();
  }

  public registerRequest(
    request: ILogRequest | HeliconeCustomEventRequest,
    headers?: Record<string, string>
  ): void {
    this.request = request;
    this.headers = {
      ...this.headers,
      ...(headers || {}),
    };
  }

  public sendLog(
    response: {
      [key: string]: any;
    },
    meta?: Record<string, string>
  ): void {
    if (this.request === null) {
      console.error("Request is not registered.");
      return;
    }

    this.endTime = Date.now();

    try {
      const providerRequest: ProviderRequest = {
        url: "custom-model-nopath",
        json: {
          ...this.request,
          model: this.getModelFromRequest(this.request),
        },
        meta: meta ?? {},
      };

      const providerResponse: ProviderResponse = {
        headers: this.headers,
        status: parseInt(meta ? meta.status ?? "200" : "200"),
        json: {
          ...response,
          model: this.getModelFromRequest(this.request),
        },
      };

      const timing: Timing = {
        startTime: {
          seconds: Math.trunc(this.startTime / 1000),
          milliseconds: this.startTime % 1000,
        },
        endTime: {
          seconds: Math.trunc(this.endTime / 1000),
          milliseconds: this.endTime % 1000,
        },
      };

      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          ...this.headers,
        },
        body: JSON.stringify({
          providerRequest,
          providerResponse,
          timing,
        }),
      };

      fetch(this.LOGGING_ENDPOINT, options);
    } catch (error: any) {
      console.error(
        "Error making request to Helicone log endpoint:",
        error?.message,
        error
      );

      return;
    }
  }

  private getModelFromRequest(
    request: ILogRequest | HeliconeCustomEventRequest
  ): string {
    if ("model" in request) {
      return request.model;
    } else if (request.type === "tool") {
      return `tool`;
    } else {
      return `vector_db`;
    }
  }
}

/*
 * Type Definitions
 *
 * */

type ProviderRequest = {
  url: string;
  json: {
    [key: string]: any;
  };
  meta: Record<string, string>;
};

type ProviderResponse = {
  json: {
    [key: string]: any;
  };
  status: number;
  headers: Record<string, string>;
};

type Timing = {
  startTime: {
    seconds: number;
    milliseconds: number;
  };
  endTime: {
    seconds: number;
    milliseconds: number;
  };
};

type IHeliconeManualLogger = {
  apiKey: string;
  headers?: Record<string, string>;
};

type ILogRequest = {
  model: string;
  [key: string]: any;
};

// type ILogResponse = {
//   id: string;
//   object: string;
//   created: string;
//   model: string;
//   choices: Array<{
//     index: number;
//     finish_reason: string;
//     message: {
//       role: string;
//       content: string;
//     };
//   }>;
//   usage?: {
//     prompt_tokens: number;
//     completion_tokens: number;
//     total_tokens: number;
//   };
// };

interface HeliconeEventTool {
  type: "tool";
  name: string;
  input: string;
}

interface HeliconeEventVectorDB {
  type: "vector_db";
  operation: "search" | "insert" | "delete" | "update"; // this is very rough, not even needed, just there as dummy attributes for now
  query: {
    text?: string;
    vector?: number[];
    topK?: number;
    filter?: object;
    [key: string]: any; // For any additional parameters
  };
  databaseName?: string; // Optional, to specify which vector DB is being used
}

type HeliconeCustomEventRequest = HeliconeEventTool | HeliconeEventVectorDB;
