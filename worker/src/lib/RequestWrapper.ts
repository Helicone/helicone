// This request wrapper allows us to mock the request object in tests.
// It also allows us to add additional functionality to the request object
// without modifying the request object itself.
// This also allows us to not have to redefine other objects repetitively like URL.

export type RequestHandlerType =
  | "proxy_only"
  | "proxy_log"
  | "logging"
  | "feedback";

type Nullable<T> = T | null;
export interface HeliconeHeaders {
  heliconeAuth: Nullable<string>;
  rateLimitPolicy: Nullable<string>;
  featureFlags: {
    streamForceFormat: boolean;
    increaseTimeout: boolean;
  };
  retryHeaders: Nullable<{
    enabled: boolean;
    retries: number;
    factor: number;
    minTimeout: number;
    maxTimeout: number;
  }>;
  openaiBaseUrl: Nullable<string>;
  promptFormat: Nullable<string>;
  requestId: Nullable<string>;
  promptId: Nullable<string>;
  promptName: Nullable<string>;
}

export class RequestWrapper {
  url: URL;
  heliconeHeaders: HeliconeHeaders;
  heliconeProperties: Record<string, string>;
  authorization: string | undefined;

  private cachedText: string | null = null;

  constructor(private request: Request) {
    this.url = new URL(request.url);
    this.heliconeHeaders = this.getHeliconeHeaders();
    this.authorization = this.getAuthorization();
    this.heliconeProperties = this.getHeliconeProperties();
  }

  async getText(): Promise<string> {
    if (this.cachedText) {
      return this.cachedText;
    }

    this.cachedText = await this.request.text();
    return this.cachedText;
  }

  async getJson<T>(): Promise<T> {
    return JSON.parse(await this.getText());
  }

  getBody(): ReadableStream<Uint8Array> | null {
    return this.request.body;
  }

  getHeaders(): Headers {
    return this.request.headers;
  }

  setHeader(key: string, value: string): void {
    this.request.headers.set(key, value);
  }

  getMethod(): string {
    return this.request.method;
  }

  getUrl(): string {
    return this.request.url;
  }

  getRequestHandlerType(): RequestHandlerType {
    if (this.url.pathname.includes("audio")) {
      return "proxy_only";
    }
    const method = this.getMethod();

    if (method === "POST" && this.url.pathname === "/v1/log") {
      return "logging";
    }

    if (method === "POST" && this.url.pathname === "/v1/feedback") {
      return "feedback";
    }

    return "proxy_log";
  }

  async getUserId(): Promise<string | undefined> {
    const heliconeUserIdHeader = "helicone-user-id";
    const userId =
      this.request.headers.get(heliconeUserIdHeader) ||
      (await this.getJson<{ user?: string }>()).user;
    return userId;
  }

  private getAuthorization(): string | undefined {
    return this.getHeaders().get("Authorization") ?? undefined;
  }

  private getHeliconeHeaders(): HeliconeHeaders {
    return {
      heliconeAuth: this.getHeaders().get("helicone-auth") ?? null,
      featureFlags: this.getHeliconeFeatureFlags(),
      rateLimitPolicy:
        this.getHeaders().get("Helicone-RateLimit-Policy") ?? null,
      openaiBaseUrl: this.getHeaders().get("Helicone-OpenAI-Api-Base") ?? null,
      retryHeaders: this.getRetryHeaders(),
      promptFormat: this.getHeaders().get("Helicone-Prompt-Format") ?? null,
      requestId: this.getHeaders().get("Helicone-Request-Id") ?? null,
      promptId: this.getHeaders().get("Helicone-Prompt-Id") ?? null,
      promptName: this.getHeaders().get("Helicone-Prompt-Name") ?? null,
    };
  }

  private getRetryHeaders(): HeliconeHeaders["retryHeaders"] {
    const retryEnabled = this.getHeaders().get("helicone-retry-enabled");
    if (retryEnabled === null) {
      return null;
    }
    return {
      enabled: retryEnabled === "true",
      retries: parseInt(this.getHeaders().get("helicone-retry-num") ?? "5", 10),
      factor: parseFloat(this.getHeaders().get("helicone-retry-factor") ?? "2"),
      minTimeout: parseInt(
        this.getHeaders().get("helicone-retry-min-timeout") ?? "1000",
        10
      ),
      maxTimeout: parseInt(
        this.getHeaders().get("helicone-retry-max-timeout") ?? "10000",
        10
      ),
    };
  }

  private getHeliconeFeatureFlags(): HeliconeHeaders["featureFlags"] {
    const streamForceFormat = this.getHeaders().get(
      "helicone-stream-force-format"
    );
    const increaseTimeout = this.getHeaders().get("helicone-increase-timeout");
    return {
      streamForceFormat: streamForceFormat === "true",
      increaseTimeout: increaseTimeout === "true",
    };
  }

  private getHeliconeProperties(): Record<string, string> {
    const propTag = "helicone-property-";
    const heliconeHeaders = Object.fromEntries(
      [...this.getHeaders().entries()]
        .filter(
          ([key]) =>
            key.toLowerCase().startsWith(propTag.toLowerCase()) &&
            key.length > propTag.length
        )
        .map(([key, value]) => [key.substring(propTag.length), value])
    );
    return heliconeHeaders;
  }
}
