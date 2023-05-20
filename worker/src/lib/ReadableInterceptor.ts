import EventEmitter from "events";

const CHUNK_EVENT = "done";
const CHUNK_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export class ReadableInterceptor {
  private chunkEmitter: EventEmitter;
  private cachedChunk: string | null = null;
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
    const transform = (
      chunk: any,
      controller: TransformStreamDefaultController<any>
    ) => {
      this.responseBody += this.decoder.decode(chunk);
      controller.enqueue(chunk);
    };
    const flush = () => {
      this.chunkEmitter.emit(CHUNK_EVENT, this.responseBody);
    };

    const loggingTransformStream = new TransformStream({
      transform,
      flush,
    });
    return stream.pipeThrough(loggingTransformStream);
  }

  async waitForChunk(): Promise<string> {
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
  private once = (eventName: string): Promise<string> =>
    new Promise((resolve) => {
      const listener = (value: string) => {
        this.chunkEmitter.removeListener(eventName, listener);
        resolve(value);
      };
      this.chunkEmitter.addListener(eventName, listener);

      this.responseBodyTimeout(CHUNK_TIMEOUT).then(() => {
        this.chunkEmitter.removeListener(eventName, listener);
        resolve("response body timeout");
      });
    });
}
