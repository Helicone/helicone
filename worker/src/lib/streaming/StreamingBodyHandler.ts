import { JSONParser } from "@streamparser/json-whatwg";
import { S3Client } from "../clients/S3Client";
import { DataDogClient } from "../monitoring/DataDogClient";

export interface BodyMetadata {
  model?: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  prompt_id?: string;
  environment?: string;
  version_id?: string;
  inputs?: any;
  stream_options?: any;
  tools?: any[];
  bodySize?: number;
}

export interface BodyStreams {
  forward: ReadableStream;
  metadata: BodyMetadata;
  s3Promise: Promise<string>;
}

export class StreamingBodyHandler {
  private metadata?: BodyMetadata;
  private streams?: BodyStreams;
  private initialized = false;

  constructor(
    private request: Request,
    private env: Env,
    private orgId: string,
    private requestId: string,
    private dataDogClient?: DataDogClient
  ) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    if (!this.request.body) {
      this.metadata = {};
      this.streams = {
        forward: new ReadableStream(),
        metadata: {},
        s3Promise: Promise.resolve(""),
      };
      return;
    }

    // Create 3 streams from the original body
    const [metadataStream, s3Stream, forwardStream] = this.teeThree(
      this.request.body
    );

    // Start metadata extraction
    const metadataPromise = this.extractMetadata(metadataStream);

    // Start S3 upload in parallel
    const s3Promise = this.streamToS3(s3Stream);

    // Wait for metadata (needed for routing)
    this.metadata = await metadataPromise;

    // Track memory usage
    if (this.dataDogClient && this.metadata.bodySize) {
      try {
        this.dataDogClient.trackMemory(
          "request-body-stream",
          this.metadata.bodySize
        );
      } catch (e) {
        // Silently catch - monitoring must not break the flow
      }
    }

    this.streams = {
      forward: forwardStream,
      metadata: this.metadata,
      s3Promise,
    };
  }

  private teeThree(
    stream: ReadableStream
  ): [ReadableStream, ReadableStream, ReadableStream] {
    const [stream1, stream2] = stream.tee();
    const [stream2a, stream2b] = stream2.tee();
    return [stream1, stream2a, stream2b];
  }

  private async extractMetadata(stream: ReadableStream): Promise<BodyMetadata> {
    const metadata: BodyMetadata = {};
    let bytesRead = 0;

    // JSONParser from @streamparser/json-whatwg is a TransformStream
    const parser = new JSONParser({
      paths: [
        "$.model",
        "$.stream",
        "$.temperature",
        "$.max_tokens",
        "$.prompt_id",
        "$.environment",
        "$.version_id",
        "$.inputs",
        "$.stream_options",
        "$.tools.*",     // Get all tools
      ],
      stringBufferSize: undefined,
    });

    // Pipe the stream through the parser TransformStream
    const parsedStream = stream.pipeThrough(parser);
    const reader = parsedStream.getReader();

    try {
      const maxBytesToRead = 100_000; // 100KB should be enough for metadata

      while (bytesRead < maxBytesToRead) {
        const { done, value: item } = await reader.read();
        if (done) break;

        bytesRead += JSON.stringify(item).length; // Rough estimate

        // The parser only emits values matching our paths
        // item.stack tells us the parent hierarchy
        // item.key is the final key in the path
        // item.value is the actual value
        
        // Check stack to determine field type
        if (!item.stack || item.stack.length === 1) {
          // Top-level fields have stack with 1 item (or possibly no stack)
          // The first stack item is usually { emit: false }
          switch (item.key) {
            case "model":
              metadata.model = item.value as string;
              break;
            case "stream":
              metadata.stream = item.value as boolean;
              break;
            case "temperature":
              metadata.temperature = item.value as number;
              break;
            case "max_tokens":
              metadata.max_tokens = item.value as number;
              break;
            case "prompt_id":
              metadata.prompt_id = item.value as string;
              break;
            case "environment":
              metadata.environment = item.value as string;
              break;
            case "version_id":
              metadata.version_id = item.value as string;
              break;
            case "inputs":
              metadata.inputs = item.value;
              break;
            case "stream_options":
              metadata.stream_options = item.value;
              break;
          }
        } 
        // Array elements have stack with 2+ items
        else if (item.stack && item.stack.length >= 2) {
          // The second stack item contains the array key info
          const arrayParent = item.stack[1];
          
          // Check if this is a tools array element
          if (arrayParent.key === "tools") {
            const index = parseInt(item.key as string);
            if (!metadata.tools) {
              metadata.tools = [];
            }
            metadata.tools[index] = item.value;
          }
        }

        // Early exit once we have critical routing info
        // We need model for routing and stream to know response type
        if (metadata.model && metadata.stream !== undefined) {
          // Continue reading in background to drain the stream
          this.drainStream(reader);
          break;
        }
      }

      // If we didn't exit early, drain the rest
      if (bytesRead >= maxBytesToRead) {
        this.drainStream(reader);
      }
    } catch (error) {
      console.error("Error extracting metadata:", error);
      // Continue without metadata rather than failing
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // Reader might already be released
      }
    }

    // Estimate body size from Content-Length
    const contentLength = this.request.headers.get("content-length");
    if (contentLength) {
      metadata.bodySize = parseInt(contentLength);
    }

    return metadata;
  }


  private async drainStream(
    reader: ReadableStreamDefaultReader
  ): Promise<void> {
    // Continue reading in background to prevent backpressure
    (async () => {
      try {
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      } catch {
        // Ignore errors in draining
      }
    })();
  }

  private async streamToS3(stream: ReadableStream): Promise<string> {
    try {
      const s3Client = new S3Client(
        this.env.S3_ACCESS_KEY ?? "",
        this.env.S3_SECRET_KEY ?? "",
        this.env.S3_ENDPOINT ?? "",
        this.env.S3_BUCKET_NAME ?? "",
        this.env.S3_REGION ?? "us-west-2"
      );

      const url = s3Client.getRequestResponseRawUrl(this.requestId, this.orgId);

      // Create a pass-through transform to track bytes
      let totalBytes = 0;
      const trackingStream = new TransformStream({
        transform(chunk, controller) {
          totalBytes += chunk.byteLength;
          controller.enqueue(chunk);
        },
      });

      const trackedStream = stream.pipeThrough(trackingStream);

      // Sign the request for S3 (don't pass body to sign)
      const contentLength = this.request.headers.get("content-length");
      const signedRequest = await s3Client.signRequest(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(contentLength ? { "Content-Length": contentLength } : {}),
        },
      });

      // Upload to S3 with the tracked stream
      const response = await fetch(signedRequest.url, {
        method: "PUT",
        headers: signedRequest.headers,
        body: trackedStream,
        // @ts-ignore - duplex is needed for streaming but not in types
        duplex: "half",
      });

      if (!response.ok) {
        throw new Error(`S3 upload failed: ${response.statusText}`);
      }

      // Track S3 upload in DataDog
      if (this.dataDogClient && totalBytes > 0) {
        try {
          this.dataDogClient.trackMemory("s3-upload", totalBytes);
        } catch {
          // Silently catch
        }
      }

      return url;
    } catch (error) {
      console.error("S3 streaming upload failed:", error);
      // Return empty string on failure - don't break the request
      return "";
    }
  }

  // Public API
  async getMetadata(): Promise<BodyMetadata> {
    await this.initialize();
    return this.metadata || {};
  }

  async getForwardStream(): Promise<ReadableStream | null> {
    await this.initialize();
    return this.streams?.forward || null;
  }

  async getS3Url(): Promise<string> {
    await this.initialize();
    return this.streams?.s3Promise || Promise.resolve("");
  }

  async getBodyForProviderForwarding(): Promise<
    ReadableStream | string | null
  > {
    const stream = await this.getForwardStream();

    // If we need to add stream_options
    const metadata = await this.getMetadata();
    if (metadata.stream && !metadata.stream_options?.include_usage) {
      return this.addStreamOptions(stream!);
    }

    return stream;
  }

  private addStreamOptions(stream: ReadableStream): ReadableStream {
    let injected = false;
    let buffer = "";

    return stream.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk, { stream: true });
          buffer += text;

          // Try to inject stream_options before the last }
          if (!injected && buffer.length > 100) {
            const lastBrace = buffer.lastIndexOf("}");
            if (lastBrace > 0) {
              const before = buffer.slice(0, lastBrace);
              const after = buffer.slice(lastBrace);

              // Check if stream_options already exists
              if (!before.includes('"stream_options"')) {
                buffer =
                  before + ',"stream_options":{"include_usage":true}' + after;
                injected = true;
              }
            }
          }

          // Output chunks
          if (buffer.length > 1000 || injected) {
            controller.enqueue(new TextEncoder().encode(buffer));
            buffer = "";
          }
        },

        flush(controller) {
          if (buffer) {
            // Last chance to inject if we haven't yet
            if (!injected && !buffer.includes('"stream_options"')) {
              const lastBrace = buffer.lastIndexOf("}");
              if (lastBrace > 0) {
                const before = buffer.slice(0, lastBrace);
                const after = buffer.slice(lastBrace);
                buffer =
                  before + ',"stream_options":{"include_usage":true}' + after;
              }
            }
            controller.enqueue(new TextEncoder().encode(buffer));
          }
        },
      })
    );
  }
}