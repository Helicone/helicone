import EventEmitter from "events";

const CHUNK_EVENT = "done";
const CHUNK_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export interface CompletedChunk {
  body: string;
  reason: "cancel" | "done" | "timeout";
}

export class ReadableInterceptor {
  private chunkEmitter: EventEmitter;
  private cachedChunk: CompletedChunk | null = null;
  private responseBody = "";
  private decoder = new TextDecoder();
  stream: ReadableStream;

  constructor(stream: ReadableStream) {
    this.chunkEmitter = new EventEmitter();
    this.once(CHUNK_EVENT).then((value) => {
      this.cachedChunk = value;
    });
    this.stream = this.interceptStream(stream);
  }

  private interceptStream(stream: ReadableStream): ReadableStream {
    const onDone = (reason: "cancel" | "done") => {
      this.chunkEmitter.emit(CHUNK_EVENT, {
        body: this.responseBody,
        reason,
      });
    };

    const onChunk = (chunk: Uint8Array) => {
      this.responseBody += this.decoder.decode(chunk);
    };

    const reader = stream.getReader();
    const readable = new ReadableStream({
      pull(controller) {
        return reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            onDone("done");
            return;
          }

          controller.enqueue(value);
          onChunk(value as Uint8Array);
        });
      },

      cancel(reason) {
        console.error("Stream was canceled:", reason);
        stream.cancel(reason); // Cancel the source
        onDone("cancel"); // Resolve the cancellation promise
      },
    });
    return readable;
  }

  async waitForChunk(): Promise<CompletedChunk> {
    // instantiate promise before emitting event
    // so that it doesn't get missed (race condition)
    const promise = this.once(CHUNK_EVENT);
    if (this.cachedChunk) {
      return this.cachedChunk;
    }
    return promise;
  }

  private async responseBodyTimeout(delay_ms: number) {
    await new Promise((resolve) => setTimeout(resolve, delay_ms));
  }

  // waits for a chunk to be emitted
  private once = (eventName: string): Promise<CompletedChunk> =>
    new Promise((resolve) => {
      const listener = (value: CompletedChunk) => {
        this.chunkEmitter.removeListener(eventName, listener);
        resolve(value);
      };
      this.chunkEmitter.addListener(eventName, listener);

      this.responseBodyTimeout(CHUNK_TIMEOUT).then(() => {
        this.chunkEmitter.removeListener(eventName, listener);
        resolve({
          body: this.responseBody,
          reason: "timeout",
        });
      });
    });
}
