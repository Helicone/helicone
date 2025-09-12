import { EventEmitter } from "events";
import { logObjectMemoryUsage } from "../../observability/memory";

export interface CompletedStream {
  body: string[];
  reason: "cancel" | "done" | "timeout";
  endTimeUnix: number;
  firstChunkTimeUnix: number | null;
}

export class ReadableInterceptor {
  private chunkEmitter = new EventEmitter();
  private cachedChunk: CompletedStream | null = null;
  private responseBody: string[] = [];
  private decoder = new TextDecoder("utf-8");
  private firstChunkTimeUnix: number | null = null;
  stream: ReadableStream;

  constructor(
    stream: ReadableStream,
    private isStream: boolean,
    private chunkEventName = "done",
    private chunkTimeoutMs = 30 * 60 * 1000 // Default to 30 minutes
  ) {
    this.stream = this.interceptStream(stream);
    this.setupChunkListener();
  }

  private setupChunkListener() {
    this.once(this.chunkEventName).then((value) => {
      this.cachedChunk = value;
    });
  }

  private interceptStream(stream: ReadableStream): ReadableStream {
    const onDone = (reason: "cancel" | "done") => {
      logObjectMemoryUsage(this.responseBody, "ReadableInterceptor.onDone");
      this.chunkEmitter.emit(this.chunkEventName, {
        body: this.responseBody,
        reason,
        endTimeUnix: new Date().getTime(),
        firstChunkTimeUnix: this.firstChunkTimeUnix,
      } as CompletedStream);
    };

    const onChunk = (chunk: Uint8Array) => {
      if (this.isStream && this.firstChunkTimeUnix === null) {
        this.firstChunkTimeUnix = Date.now();
      }

      this.responseBody.push(this.decoder.decode(chunk, { stream: true }));
    };

    const reader = stream.getReader();

    const readable = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            onDone("done");
            return;
          }

          if (value) {
            controller.enqueue(value);
            onChunk(value);
          }
        } catch (error) {
          console.error("An error occurred while reading the stream:", error);
          controller.error(error);
        }
      },

      cancel(reason) {
        console.error("Stream was canceled:", reason);
        stream.cancel(reason);
        onDone("cancel");
      },
    });

    return readable;
  }

  async waitForStream(): Promise<CompletedStream> {
    const startTime = Date.now();

    while (!this.cachedChunk) {
      // Check if the waiting duration has exceeded streamTimeoutMs
      if (Date.now() - startTime >= this.chunkTimeoutMs) {
        throw new Error("Waiting for chunk timed out");
      }

      // Wait for 1s before rechecking
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return this.cachedChunk;
  }

  private once(eventName: string): Promise<CompletedStream> {
    return new Promise((resolve, _reject) => {
      const listener = (value: CompletedStream) => {
        clearTimeout(timeoutId);
        this.chunkEmitter.removeListener(eventName, listener);
        resolve(value);
      };

      const timeoutId = setTimeout(() => {
        this.chunkEmitter.removeListener(eventName, listener);
        resolve({
          body: this.responseBody,
          reason: "timeout",
          endTimeUnix: new Date().getTime(),
          firstChunkTimeUnix: this.firstChunkTimeUnix,
        });
      }, this.chunkTimeoutMs);

      this.chunkEmitter.addListener(eventName, listener);
    });
  }
}
