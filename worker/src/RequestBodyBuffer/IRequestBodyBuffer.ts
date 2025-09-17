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

  tempSetBody(body: string): void;

  // For forwarding to providers without reading into memory when possible.
  getReadableStreamToBody(): Promise<ValidRequestBody>;
}
