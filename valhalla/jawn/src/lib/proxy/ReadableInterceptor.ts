import { EventEmitter } from "events";
import { Readable as NodeReadableStream } from "stream";

export interface CompletedChunk {
  body: string;
  reason: "cancel" | "done" | "timeout";
  endTimeUnix: number;
  firstChunkTimeUnix: number | null;
}

export class ReadableInterceptor {
  private chunkEmitter = new EventEmitter();
  private cachedChunk: CompletedChunk | null = null;
  private responseBody = "";
  private decoder = new TextDecoder("utf-8");
  private firstChunkTimeUnix: number | null = null;
  stream: NodeReadableStream;

  constructor(
    stream: NodeReadableStream,
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

  private interceptStream(stream: NodeReadableStream): NodeReadableStream {
    const onDone = (reason: "cancel" | "done") => {
      this.chunkEmitter.emit(this.chunkEventName, {
        body: this.responseBody,
        reason,
        endTimeUnix: new Date().getTime(),
        firstChunkTimeUnix: this.firstChunkTimeUnix,
      } as CompletedChunk);
    };

    const onChunk = (chunk: Uint8Array) => {
      console.log("Received chunk of size:", chunk.length);
      if (this.isStream && this.firstChunkTimeUnix === null) {
        this.firstChunkTimeUnix = Date.now();
      }

      this.responseBody += this.decoder.decode(chunk, { stream: true });
    };

    stream.on("data", onChunk);
    stream.on("end", () => onDone("done"));
    stream.on("error", (err) => {
      console.error("Stream error:", err);
      onDone("cancel");
    });

    return stream;
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
          endTimeUnix: new Date().getTime(),
          firstChunkTimeUnix: this.firstChunkTimeUnix,
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
