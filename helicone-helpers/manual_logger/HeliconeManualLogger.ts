import {
  IHeliconeManualLogger,
  HeliconeLogRequest,
  ProviderRequest,
  ProviderResponse,
  Timing,
} from "./types";

export class HeliconeManualLogger {
  private apiKey: string;
  private headers: Record<string, string>;
  private LOGGING_ENDPOINT: string = "https://api.hconeai.com/custom/v1/log";

  constructor(opts: IHeliconeManualLogger) {
    this.apiKey = opts.apiKey;
    this.headers = opts.headers || {};
    this.LOGGING_ENDPOINT = opts.loggingEndpoint || this.LOGGING_ENDPOINT;
  }

  /**
   * Logs a custom request to Helicone
   * @param request - The request object to log
   * @param operation - The operation which will be executed and logged
   * @param additionalHeaders - Additional headers to send with the request
   * @returns The result of the `operation` function
   */
  public async logRequest<T>(
    request: HeliconeLogRequest,
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
    request: HeliconeLogRequest,
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
      },
      meta: {},
    };

    const providerResponse: ProviderResponse = {
      headers: this.headers,
      status: 200,
      json: {
        ...response,
        _type: request._type,
        toolName: request.toolName,
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
