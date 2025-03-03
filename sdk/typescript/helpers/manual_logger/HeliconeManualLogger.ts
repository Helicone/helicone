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

  /**
   * Logs a single stream to Helicone
   * @param request - The request object to log
   * @param stream - The ReadableStream to consume and log
   * @param additionalHeaders - Additional headers to send with the request
   * @returns A Promise that resolves when logging is complete
   */
  public async logSingleStream(
    request: HeliconeLogRequest,
    stream: ReadableStream,
    additionalHeaders?: Record<string, string>
  ): Promise<void> {
    const startTime = Date.now();
    const resultRecorder = new HeliconeStreamResultRecorder();
    resultRecorder.attachStream(stream);
    let firstChunkTimeUnix: number | null = null;

    const streamedData: any[] = [];
    const decoder = new TextDecoder();
    for await (const chunk of stream) {
      if (!firstChunkTimeUnix) {
        firstChunkTimeUnix = Date.now();
      }
      streamedData.push(decoder.decode(chunk));
    }

    await this.sendLog(request, streamedData.join(""), {
      startTime,
      endTime: Date.now(),
      additionalHeaders,
      timeToFirstToken: firstChunkTimeUnix ? firstChunkTimeUnix - startTime : undefined,
    });
  }

  /**
   * Logs a single request with a response body to Helicone
   * @param request - The request object to log
   * @param body - The response body as a string
   * @param additionalHeaders - Additional headers to send with the request
   * @returns A Promise that resolves when logging is complete
   */
  public async logSingleRequest(
    request: HeliconeLogRequest,
    body: string,
    additionalHeaders?: Record<string, string>
  ): Promise<void> {
    const startTime = Date.now();

    await this.sendLog(request, body, {
      startTime,
      endTime: Date.now(),
      additionalHeaders,
    });
  }

  /**
   * Logs a streaming operation to Helicone
   * @param request - The request object to log
   * @param operation - The operation which will be executed and logged, with access to a stream recorder
   * @param additionalHeaders - Additional headers to send with the request
   * @returns The result of the `operation` function
   *
   * @example
   * ```typescript
   * const response = await llmProvider.createChatCompletion({ stream: true, ... });
   * const [stream1, stream2] = response.tee();
   *
   * helicone.logStream(
   *   requestBody,
   *   async (resultRecorder) => {
   *     resultRecorder.attachStream(stream2.toReadableStream());
   *     return stream1;
   *   },
   *   { "Helicone-User-Id": userId }
   * );
   * ```
   */
  public async logStream<T>(
    request: HeliconeLogRequest,
    operation: (resultRecorder: HeliconeStreamResultRecorder) => Promise<T>,
    additionalHeaders?: Record<string, string>
  ): Promise<T> {
    const startTime = Date.now();
    const resultRecorder = new HeliconeStreamResultRecorder();
    const result = await operation(resultRecorder);
    try {
      await resultRecorder.getStreamTexts().then(async (texts) => {
        const endTime = Date.now();
        await this.sendLog(request, texts.join(""), {
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

/**
 * Recorder for handling and processing streams in Helicone logging
 * Used to capture and process streaming responses from LLM providers
 */
class HeliconeStreamResultRecorder {
  private streams: ReadableStream[] = [];
  firstChunkTimeUnix: number | null = null;

  constructor() {}

  /**
   * Attaches a ReadableStream to be processed
   * @param stream - The ReadableStream to attach
   */
  attachStream(stream: ReadableStream): void {
    this.streams.push(stream);
  }

  /**
   * Processes all attached streams and returns their contents as strings
   * @returns Promise resolving to an array of strings containing the content of each stream
   */
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

/**
 * Recorder for handling and storing results in Helicone logging
 * Used to capture non-streaming responses from operations
 */
class HeliconeResultRecorder {
  private results: Record<string, any> = {};

  /**
   * Appends data to the results object
   * @param data - The data to append to the results
   */
  appendResults(data: Record<string, any>): void {
    this.results = { ...this.results, ...data };
  }

  /**
   * Gets the current results
   * @returns The current results object
   */
  getResults(): Record<string, any> {
    return this.results;
  }
}
