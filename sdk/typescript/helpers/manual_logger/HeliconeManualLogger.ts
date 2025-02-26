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
  private LOGGING_ENDPOINT: string =
    "https://api.worker.helicone.ai/custom/v1/log";

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

      this.sendLog(request, resultRecorder.getResults(), {
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

  public async logStream<T>(
    request: HeliconeLogRequest,
    operation: (resultRecorder: HeliconeStreamResultRecorder) => Promise<T>,
    additionalHeaders?: Record<string, string>
  ): Promise<T> {
    const startTime = Date.now();
    const resultRecorder = new HeliconeStreamResultRecorder();
    const result = await operation(resultRecorder);
    try {
      await resultRecorder.getStreamTexts().then((texts) => {
        const endTime = Date.now();
        this.sendLog(request, texts.join(""), {
          startTime,
          endTime,
          additionalHeaders,
          timeToFirstToken: resultRecorder.firstChunkTimeUnix
            ? resultRecorder.firstChunkTimeUnix - startTime
            : undefined,
        });
      });
      return result;
    } catch (error) {
      console.error("Helicone error during stream logging:", error);
      throw error;
    }
  }

  private async sendLog(
    request: HeliconeLogRequest,
    response: Record<string, any> | string,
    options: {
      startTime: number;
      endTime: number;
      additionalHeaders?: Record<string, string>;
      timeToFirstToken?: number;
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

    const isResponseString = typeof response === "string";

    const providerResponse: ProviderResponse = {
      headers: this.headers,
      status: 200,
      json: isResponseString
        ? {}
        : {
            ...response,
            _type: request._type,
            toolName: request.toolName,
          },
      textBody: isResponseString ? response : undefined,
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
      timeToFirstToken: options.timeToFirstToken,
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

class HeliconeStreamResultRecorder {
  private streams: ReadableStream[] = [];
  firstChunkTimeUnix: number | null = null;

  constructor() {}

  attachStream(stream: ReadableStream): void {
    this.streams.push(stream);
  }

  async getStreamTexts(): Promise<string[]> {
    const decoder = new TextDecoder();
    return Promise.all(
      this.streams.map(async (stream) => {
        if (!this.firstChunkTimeUnix) {
          this.firstChunkTimeUnix = Date.now();
        }
        const streamedData: any[] = [];
        for await (const chunk of stream) {
          streamedData.push(decoder.decode(chunk));
        }
        return streamedData.join("");
      })
    );
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
