export class HeliconeManualLogger {
  private apiKey: string;
  private headers: Record<string, string>;
  private readonly LOGGING_ENDPOINT: string =
    "https://api.hconeai.com/custom/v1/log";

  constructor(opts: IHeliconeManualLogger) {
    this.apiKey = opts.apiKey;
    this.headers = opts.headers || {};
  }

  public async logRequest<T>(
    request: ILogRequest | HeliconeCustomEventRequest,
    operation: (resultRecorder: HeliconeResultRecorder) => Promise<T>,
    additionalHeaders?: Record<string, string>
  ): Promise<T> {
    const startTime = Date.now();
    const resultRecorder = new HeliconeResultRecorder();

    try {
      const result = await operation(resultRecorder);
      const endTime = Date.now();

      await this.sendLog(request, resultRecorder.getResults(), {
        startTime,
        endTime,
        additionalHeaders,
      });

      return result;
    } catch (error) {
      console.error("Error during operation:", error);
      throw error;
    }
  }

  private async sendLog(
    request: ILogRequest | HeliconeCustomEventRequest,
    response: Record<string, any>,
    options: {
      startTime: number;
      endTime: number;
      additionalHeaders?: Record<string, string>;
    }
  ): Promise<void> {
    const { startTime, endTime, additionalHeaders } = options;

    const providerRequest: ProviderRequest = {
      url: "custom-model-nopath",
      json: {
        ...request,
        // model: this.getModelFromRequest(request),
      },
      meta: {},
    };

    const providerResponse: ProviderResponse = {
      headers: this.headers,
      status: 200,
      json: {
        ...response,
        _type: request._type,
        // model: this.getModelFromRequest(request),
      },
    };

    const timing: Timing = {
      startTime: {
        seconds: Math.trunc(startTime / 1000),
        milliseconds: startTime % 1000,
      },
      endTime: {
        seconds: Math.trunc(endTime / 1000),
        milliseconds: endTime % 1000,
      },
    };

    const fetchOptions = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...this.headers,
        ...additionalHeaders,
      },
      body: JSON.stringify({
        providerRequest,
        providerResponse,
        timing,
      }),
    };

    try {
      await fetch(this.LOGGING_ENDPOINT, fetchOptions);
    } catch (error: any) {
      console.error(
        "Error making request to Helicone log endpoint:",
        error?.message,
        error
      );
    }
  }
}

class HeliconeResultRecorder {
  private results: Record<string, any> = {};

  appendResults(data: Record<string, any>): void {
    this.results = { ...this.results, ...data };
  }

  getResults(): Record<string, any> {
    return this.results;
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

interface HeliconeEventTool {
  _type: "tool";
  toolName: string;
  input: string;
}

interface HeliconeEventVectorDB {
  _type: "vector_db";
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
