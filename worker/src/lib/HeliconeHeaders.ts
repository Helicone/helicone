type Nullable<T> = T | null;

export interface IHeliconeHeaders {
  heliconeAuth: Nullable<string>;
  heliconeAuthV2: Nullable<{
    _type: "jwt" | "bearer";
    token: string;
  }>;
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
  userId: Nullable<string>;
  omitHeaders: {
    omitResponse: boolean;
    omitRequest: boolean;
  };
}

export class HeliconeHeaders implements IHeliconeHeaders {
  heliconeProperties: Record<string, string>;
  heliconeAuth: Nullable<string>;
  heliconeAuthV2: Nullable<{
    _type: "jwt" | "bearer";
    token: string;
  }>;
  rateLimitPolicy: Nullable<string>;
  featureFlags: { streamForceFormat: boolean; increaseTimeout: boolean };
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
  userId: Nullable<string>;
  omitHeaders: { omitResponse: boolean; omitRequest: boolean };

  constructor(private headers: Headers) {
    const heliconeHeaders = this.getHeliconeHeaders();
    this.heliconeAuth = heliconeHeaders.heliconeAuth;
    this.heliconeAuthV2 = heliconeHeaders.heliconeAuthV2;
    this.rateLimitPolicy = heliconeHeaders.rateLimitPolicy;
    this.featureFlags = heliconeHeaders.featureFlags;
    this.retryHeaders = heliconeHeaders.retryHeaders;
    this.openaiBaseUrl = heliconeHeaders.openaiBaseUrl;
    this.promptFormat = heliconeHeaders.promptFormat;
    this.requestId = heliconeHeaders.requestId;
    this.promptId = heliconeHeaders.promptId;
    this.promptName = heliconeHeaders.promptName;
    this.omitHeaders = heliconeHeaders.omitHeaders;
    this.userId = heliconeHeaders.userId;
    this.heliconeProperties = this.getHeliconeProperties();
  }

  private getHeliconeAuthV2(): Nullable<{
    _type: "jwt" | "bearer";
    token: string;
  }> {
    const heliconeAuth = this.headers.get("helicone-auth");
    const heliconeAuthJWT = this.headers.get("helicone-jwt");
    if (heliconeAuth) {
      return {
        _type: "bearer",
        token: heliconeAuth.replace("Bearer ", ""),
      };
    }
    if (heliconeAuthJWT) {
      return {
        _type: "jwt",
        token: heliconeAuthJWT,
      };
    }
    return null;
  }

  private getHeliconeHeaders(): IHeliconeHeaders {
    return {
      heliconeAuth: this.headers.get("helicone-auth") ?? null,
      heliconeAuthV2: this.getHeliconeAuthV2(),
      featureFlags: this.getHeliconeFeatureFlags(),
      rateLimitPolicy: this.headers.get("Helicone-RateLimit-Policy") ?? null,
      openaiBaseUrl: this.headers.get("Helicone-OpenAI-Api-Base") ?? null,
      retryHeaders: this.getRetryHeaders(),
      promptFormat: this.headers.get("Helicone-Prompt-Format") ?? null,
      requestId: this.headers.get("Helicone-Request-Id") ?? null,
      promptId: this.headers.get("Helicone-Prompt-Id") ?? null,
      promptName: this.headers.get("Helicone-Prompt-Name") ?? null,
      userId: this.headers.get("Helicone-User-Id") ?? null,
      omitHeaders: {
        omitResponse: this.headers.get("Helicone-Omit-Response") === "true",
        omitRequest: this.headers.get("Helicone-Omit-Request") === "true",
      },
    };
  }

  private getRetryHeaders(): IHeliconeHeaders["retryHeaders"] {
    const retryEnabled = this.headers.get("helicone-retry-enabled");
    if (retryEnabled === null) {
      return null;
    }
    return {
      enabled: retryEnabled === "true",
      retries: parseInt(this.headers.get("helicone-retry-num") ?? "5", 10),
      factor: parseFloat(this.headers.get("helicone-retry-factor") ?? "2"),
      minTimeout: parseInt(
        this.headers.get("helicone-retry-min-timeout") ?? "1000",
        10
      ),
      maxTimeout: parseInt(
        this.headers.get("helicone-retry-max-timeout") ?? "10000",
        10
      ),
    };
  }

  private getHeliconeFeatureFlags(): IHeliconeHeaders["featureFlags"] {
    const streamForceFormat = this.headers.get("helicone-stream-force-format");
    const increaseTimeout = this.headers.get("helicone-increase-timeout");
    return {
      streamForceFormat: streamForceFormat === "true",
      increaseTimeout: increaseTimeout === "true",
    };
  }

  private getHeliconeProperties(): Record<string, string> {
    const propTag = "helicone-property-";
    const heliconeHeaders = Object.fromEntries(
      [...this.headers.entries()]
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
