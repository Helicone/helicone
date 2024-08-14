export class HeliconeManualLogger {
  private apiKey: string;
  private headers: Record<string, string>;
  private request: ILogRequest | null = null;

  private startTime: number;
  private endTime: number | null = null;

  private readonly LOGGING_ENDPOINT: string =
    "https://api.hconeai.com/custom/v1/log";

  constructor(opts: IHeliconeManualLogger) {
    this.apiKey = opts.apiKey;
    this.headers = opts.headers || {};
    this.startTime = Date.now();
  }

  public registerRequest(request: ILogRequest | any): void {
    this.request = request;
  }

  public sendLog(response: ILogResponse | any, meta?: Record<string, string>): void {
    if (this.request === null) {
      console.error("Request is not registered.");
      return;
    }

    this.endTime = Date.now();

    try {
      const providerRequest: ProviderRequest = {
        url: "custom-model-nopath",
        json: this.request,
        meta: meta ?? {},
      };

      const providerResponse: ProviderResponse = {
        headers: this.headers,
        status: parseInt(meta ? meta.status ?? "200" : "200"),
        json: response,
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
} & {
  [key: string]: any;
};

type ILogResponse = {
  id: string;
  object: string;
  created: string;
  model: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};
