import { Result } from "../lib/util/results";

export type ValidRequestBody = ReadableStream | string | null;

export interface IRequestBodyBuffer {
  signAWSRequest(props: {
    region: string;
    forwardToHost: string;
    requestHeaders: Record<string, string>;
    method: string;
    urlString: string;
  }): Promise<{ newHeaders: Headers; model: string }>;

  unsafeGetRawText(): Promise<string>;

  tempSetBody(body: string): Promise<void>;

  setBodyOverride(override: object): Promise<void>;

  // For forwarding to providers without reading into memory when possible.
  getReadableStreamToBody(): Promise<ValidRequestBody>;

  isStream(): Promise<boolean>;

  userId(): Promise<string | undefined>;

  model(): Promise<string | undefined>;

  uploadS3Body(
    providerResponse: string,
    openAIResponse: string | undefined,
    url: string,
    tags?: Record<string, string>
  ): Promise<Result<string, string>>;

  bodyLength(): Promise<number>;

  //temp
  resetS3Client(env: Env): void;

  delete(): Promise<void>;

  // For AI Gateway: store original OpenAI request (from client)
  setOriginalOpenAIRequest(body: string): void;

  getOriginalOpenAIRequest(): string | null;
}
