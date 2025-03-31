import { HeliconeManualLogger } from "./HeliconeManualLogger";
import { HeliconeLogRequest } from "./types";

type Stream<T> = AsyncIterable<T> & {
  tee(): [Stream<T>, Stream<T>];
  toReadableStream(): ReadableStream<T>;
};

type StreamState = {
  isPolling: boolean;
  alreadyAttached: boolean;
};

/**
 * HeliconeLogBuilder provides a simplified way to handle streaming LLM responses
 * with better error handling and async support.
 */
export class HeliconeLogBuilder {
  private logger: HeliconeManualLogger;
  private request: HeliconeLogRequest;
  private additionalHeaders?: Record<string, string>;
  private startTime: number;
  private endTime: number = 0;
  private responseBody: string = "";
  private error: any = null;
  private timeToFirstToken?: number;
  private streamTexts: string[] = [];
  private status: number = 200;
  private wasCancelled: boolean = false;
  private streamState: StreamState = {
    isPolling: false,
    alreadyAttached: false,
  };

  private attachedStream: Stream<any> | null = null;

  /**
   * Creates a new HeliconeLogBuilder
   * @param logger - The HeliconeManualLogger instance to use for logging
   * @param request - The request object to log
   * @param additionalHeaders - Additional headers to send with the request
   */
  constructor(
    logger: HeliconeManualLogger,
    request: HeliconeLogRequest,
    additionalHeaders?: Record<string, string>
  ) {
    this.logger = logger;
    this.request = request;
    this.additionalHeaders = additionalHeaders;
    this.startTime = Date.now();
  }

  /**
   * Sets an error that occurred during the request
   * @param error - The error that occurred
   */
  public setError(error: any): void {
    this.error = error;
    this.endTime = Date.now();
    this.status = 500;
  }

  /**
   * Collects streaming responses and converts them to a readable stream
   * while also capturing the response for logging
   * @param stream - The stream from an LLM provider response
   * @returns A ReadableStream that can be returned to the client
   */
  public toReadableStream<T>(stream: Stream<T>): ReadableStream {
    if (this.streamState.alreadyAttached) {
      throw new Error("Cannot attach multiple streams");
    }
    this.streamState.alreadyAttached = true;
    const self = stream;
    let iter: AsyncIterator<any>;
    const encoder = new TextEncoder();
    let firstChunkTimeUnix: number | null = null;

    // Store the reference to this for use in the ReadableStream
    const builder = this;
    this.streamState.isPolling = true;

    return new ReadableStream({
      async start() {
        iter = self[Symbol.asyncIterator]();
      },
      async pull(ctrl: any) {
        try {
          const { value, done } = await iter.next();
          if (done) {
            builder.endTime = Date.now();
            builder.streamState.isPolling = false;
            return ctrl.close();
          }

          if (!firstChunkTimeUnix) {
            firstChunkTimeUnix = Date.now();
            builder.timeToFirstToken = firstChunkTimeUnix - builder.startTime;
          }

          const json = JSON.stringify(value) + "\n";
          builder.streamTexts.push(json);
          const bytes = encoder.encode(json);

          ctrl.enqueue(bytes);
        } catch (err) {
          builder.error = err;
          builder.endTime = Date.now();
          builder.status = 500;
          builder.streamState.isPolling = false;
          ctrl.error(err);
        }
      },
      async cancel() {
        builder.wasCancelled = true;
        builder.endTime = Date.now();
        builder.streamState.isPolling = false;
        await iter.return?.();
      },
    });
  }

  public addAdditionalHeaders(headers: Record<string, string>): void {
    this.additionalHeaders = {
      ...this.additionalHeaders,
      ...headers,
    };
  }

  /**
   * Attaches a stream to the log builder, this will consume the stream and log it on sendLog
   * @param stream - The stream to attach
   */
  public async attachStream<T>(stream: Stream<T>): Promise<void> {
    if (this.attachedStream) {
      throw new Error("Cannot attach multiple streams");
    }
    this.attachedStream = stream;
  }

  /**
   * Sets the response body for non-streaming responses
   * @param body - The response body
   */
  public setResponse(body: string): void {
    this.responseBody = body;
    this.endTime = Date.now();
  }

  private async waitForStreamToFinish(): Promise<void> {
    const maxWaitTime = 10_000; // 10 seconds

    const startTime = Date.now();
    while (this.streamState.isPolling) {
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error("Stream took too long to finish");
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return;
  }

  /**
   * Sends the log to Helicone
   * @returns A Promise that resolves when logging is complete
   */
  public async sendLog(): Promise<void> {
    if (this.attachedStream && !this.streamState.isPolling) {
      const stream = this.toReadableStream(this.attachedStream);
      const reader = stream.getReader();
      while (true) {
        const { done } = await reader.read();
        if (done) {
          break;
        }
      }
    }
    await this.waitForStreamToFinish();
    if (this.endTime === 0) {
      this.endTime = Date.now();
    }

    try {
      if (this.wasCancelled) {
        this.status = -3;
      }

      // Handle normal case
      let response =
        this.streamTexts.length > 0
          ? this.streamTexts.join("")
          : this.responseBody;

      if (this.error && !this.wasCancelled) {
        response =
          (this.error instanceof Error
            ? this.error.stack || this.error.message
            : String(this.error)) +
          "\n\n" +
          response;
      }

      await this.logger.sendLog(this.request, response, {
        startTime: this.startTime,
        endTime: this.endTime,
        additionalHeaders: this.additionalHeaders,
        timeToFirstToken: this.timeToFirstToken,
        status: this.status,
      });
    } catch (error) {
      console.error("Error sending log to Helicone:", error);
      throw error;
    }
  }
}
