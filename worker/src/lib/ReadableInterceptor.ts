import { EventEmitter } from "events";

export interface CompletedChunk {
  body: string;
  reason: "cancel" | "done" | "timeout";
}

export class ReadableInterceptor {
  private chunkEmitter = new EventEmitter();
  private cachedChunk: CompletedChunk | null = null;
  private responseBody = "";
  private decoder = new TextDecoder("utf-8");
  stream: ReadableStream;

  constructor(
    stream: ReadableStream,
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
      this.chunkEmitter.emit(this.chunkEventName, {
        body: this.responseBody,
        reason,
      });
    };

    const onChunk = (chunk: Uint8Array) => {
      this.responseBody += this.decoder.decode(chunk, { stream: true });
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

  async waitForChunk(): Promise<CompletedChunk> {
    const startTime = Date.now();

    while (!this.cachedChunk) {
      // Check if the waiting duration has exceeded chunkTimeoutMs
      if (Date.now() - startTime >= this.chunkTimeoutMs) {
        throw new Error("Waiting for chunk timed out");
      }

      // Wait for 1s before rechecking
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return this.cachedChunk;
  }

  private once(eventName: string): Promise<CompletedChunk> {
    return new Promise((resolve, _reject) => {
      const timeoutId = setTimeout(() => {
        this.chunkEmitter.removeListener(eventName, listener);
        resolve({
          body: this.responseBody,
          reason: "timeout",
        });
      }, this.chunkTimeoutMs);

      const listener = (value: CompletedChunk) => {
        clearTimeout(timeoutId);
        this.chunkEmitter.removeListener(eventName, listener);
        resolve(value);
      };

      this.chunkEmitter.addListener(eventName, listener);
    });
  }
}
