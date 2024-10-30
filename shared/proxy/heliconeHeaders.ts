import { getValidUUID } from "../utils/getValidUUID";
import { IInternalHeaders } from "./types/internalHeaders";

type Nullable<T> = T | null;

export type HeliconeFallbackCode = number | { from: number; to: number };

export type HeliconeFallback = {
  "target-url": string;
  headers: Record<string, string>;
  onCodes: HeliconeFallbackCode[];
  bodyKeyOverride?: object;
};

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
  targetBaseUrl: Nullable<string>;
  promptFormat: Nullable<string>;
  requestId: string;
  promptHeaders: {
    promptId: Nullable<string>;
    promptMode: Nullable<string>;
    promptVersion: Nullable<string>;
  };
  promptName: Nullable<string>;
  userId: Nullable<string>;
  omitHeaders: {
    omitResponse: boolean;
    omitRequest: boolean;
  };
  sessionHeaders: {
    sessionId: Nullable<string>;
    path: Nullable<string>;
    name: Nullable<string>;
  };
  nodeId: Nullable<string>;
  fallBacks: Nullable<HeliconeFallback[]>;
  modelOverride: Nullable<string>;
  promptSecurityEnabled: Nullable<string>;
  moderationsEnabled: boolean;
  posthogKey: Nullable<string>;
  lytixKey: Nullable<string>;
  posthogHost: Nullable<string>;
  webhookEnabled: boolean;
  experimentColumnId: Nullable<string>;
  experimentRowIndex: Nullable<string>;
}

export class HeliconeHeaders<T extends IInternalHeaders>
  implements IHeliconeHeaders
{
  heliconeProperties: Record<string, string>;
  heliconeAuth: Nullable<string>;
  heliconeAuthV2: Nullable<{
    _type: "jwt" | "bearer";
    token: string;
    orgId?: string;
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
  targetBaseUrl: Nullable<string>;
  promptFormat: Nullable<string>;
  requestId: string;
  promptHeaders: {
    promptId: Nullable<string>;
    promptMode: Nullable<string>;
    promptVersion: Nullable<string>;
  };
  promptName: Nullable<string>;
  userId: Nullable<string>;
  omitHeaders: { omitResponse: boolean; omitRequest: boolean };
  sessionHeaders: {
    sessionId: Nullable<string>;
    path: Nullable<string>;
    name: Nullable<string>;
  };
  nodeId: Nullable<string>;
  fallBacks: Nullable<HeliconeFallback[]>;
  modelOverride: Nullable<string>;
  promptSecurityEnabled: Nullable<string>;
  moderationsEnabled: boolean;
  posthogKey: Nullable<string>;
  posthogHost: Nullable<string>;
  webhookEnabled: boolean;
  lytixKey: Nullable<string>;
  experimentColumnId: Nullable<string>;
  experimentRowIndex: Nullable<string>;

  constructor(private headers: T) {
    const heliconeHeaders = this.getHeliconeHeaders({
      getValidUUID: getValidUUID,
    });
    this.heliconeAuth = heliconeHeaders.heliconeAuth;
    this.heliconeAuthV2 = heliconeHeaders.heliconeAuthV2;
    this.rateLimitPolicy = heliconeHeaders.rateLimitPolicy;

    this.featureFlags = heliconeHeaders.featureFlags;
    this.retryHeaders = heliconeHeaders.retryHeaders;
    this.openaiBaseUrl = heliconeHeaders.openaiBaseUrl;
    this.targetBaseUrl = heliconeHeaders.targetBaseUrl;
    this.promptFormat = heliconeHeaders.promptFormat;
    this.requestId = heliconeHeaders.requestId;
    this.promptHeaders = {
      promptId: heliconeHeaders.promptHeaders.promptId,
      promptMode: heliconeHeaders.promptHeaders.promptMode,
      promptVersion: heliconeHeaders.promptHeaders.promptVersion,
    };
    this.promptName = heliconeHeaders.promptName;
    this.omitHeaders = heliconeHeaders.omitHeaders;
    this.sessionHeaders = heliconeHeaders.sessionHeaders;
    this.userId = heliconeHeaders.userId;
    this.heliconeProperties = this.getHeliconeProperties(heliconeHeaders);
    this.nodeId = heliconeHeaders.nodeId;
    this.fallBacks = this.getFallBacks();
    this.modelOverride = heliconeHeaders.modelOverride;
    this.promptSecurityEnabled = heliconeHeaders.promptSecurityEnabled;
    this.moderationsEnabled = heliconeHeaders.moderationsEnabled;
    this.lytixKey = heliconeHeaders.lytixKey;
    this.posthogKey = heliconeHeaders.posthogKey;
    this.posthogHost = heliconeHeaders.posthogHost;
    this.webhookEnabled = heliconeHeaders.webhookEnabled;
    this.experimentColumnId = heliconeHeaders.experimentColumnId;
    this.experimentRowIndex = heliconeHeaders.experimentRowIndex;
  }

  private getFallBacks(): Nullable<HeliconeFallback[]> {
    const fallBacks = this.headers.get("helicone-fallbacks");
    if (!fallBacks) {
      return null;
    }
    const parsedFallBacks = JSON.parse(fallBacks);
    if (!Array.isArray(parsedFallBacks)) {
      throw new Error("helicone-fallbacks must be an array");
    }
    return parsedFallBacks.map((fb) => {
      if (!fb["target-url"] || !fb.headers || !fb.onCodes) {
        throw new Error(
          "helicone-fallbacks must have target-url, headers, and onCodes"
        );
      }

      if (typeof fb["target-url"] !== "string") {
        throw new Error("helicone-fallbacks target-url must be a string");
      }

      if (
        typeof fb.headers !== "object" &&
        fb.headers.entries.every(
          ([key, value]: [object, object]) =>
            typeof key === "string" && typeof value === "string"
        )
      ) {
        throw new Error("helicone-fallbacks headers must be an object");
      }

      if (
        !Array.isArray(fb.onCodes) &&
        fb.onCodes.every(
          (x: HeliconeFallbackCode) =>
            typeof x === "number" ||
            (typeof x === "object" &&
              typeof x.from === "number" &&
              typeof x.to === "number")
        )
      ) {
        throw new Error("helicone-fallbacks onCodes must be an array");
      }

      return {
        "target-url": fb["target-url"],
        headers: fb.headers,
        onCodes: fb.onCodes,
        bodyKeyOverride: fb.bodyKeyOverride,
      };
    });
  }

  private getHeliconeAuthV2(): Nullable<{
    _type: "jwt" | "bearer";
    token: string;
    orgId?: string;
  }> {
    const heliconeAuth = this.headers.get("helicone-auth");

    if (heliconeAuth) {
      return {
        _type: "bearer",
        token: heliconeAuth,
      };
    }
    const heliconeAuthFallback = this.headers.get("authorization");
    if (heliconeAuthFallback) {
      return {
        _type: "bearer",
        token: heliconeAuthFallback,
      };
    }
    const heliconeAuthJWT = this.headers.get("helicone-jwt");
    if (heliconeAuthJWT) {
      return {
        _type: "jwt",
        token: heliconeAuthJWT,
        orgId: this.headers.get("helicone-org-id") ?? undefined,
      };
    }
    return null;
  }

  private getHeliconeHeaders({
    getValidUUID,
  }: {
    getValidUUID: (uuid: string | undefined | null) => string;
  }): IHeliconeHeaders {
    const requestId = getValidUUID(this.headers.get("Helicone-Request-Id"));
    return {
      heliconeAuth: this.headers.get("helicone-auth") ?? null,
      heliconeAuthV2: this.getHeliconeAuthV2(),
      featureFlags: this.getHeliconeFeatureFlags(),
      rateLimitPolicy: this.headers.get("Helicone-RateLimit-Policy") ?? null,
      openaiBaseUrl: this.headers.get("Helicone-OpenAI-Api-Base") ?? null,
      targetBaseUrl: this.headers.get("Helicone-Target-URL") ?? null,
      retryHeaders: this.getRetryHeaders(),
      promptFormat: this.headers.get("Helicone-Prompt-Format") ?? null,
      requestId: requestId,
      promptHeaders: {
        promptId: this.headers.get("Helicone-Prompt-Id") ?? null,
        promptMode: this.headers.get("Helicone-Prompt-Mode") ?? null,
        promptVersion: this.headers.get("Helicone-Prompt-Version") ?? null,
      },
      promptName: this.headers.get("Helicone-Prompt-Name") ?? null,
      userId: this.headers.get("Helicone-User-Id") ?? null,
      omitHeaders: {
        omitResponse: this.headers.get("Helicone-Omit-Response") === "true",
        omitRequest: this.headers.get("Helicone-Omit-Request") === "true",
      },
      sessionHeaders: {
        sessionId: this.headers.get("Helicone-Session-Id") ?? null,
        path: this.headers.get("Helicone-Session-Path") ?? null,
        name: this.headers.get("Helicone-Session-Name") ?? null,
      },
      nodeId: this.headers.get("Helicone-Node-Id") ?? null,
      fallBacks: this.getFallBacks(),
      modelOverride: this.headers.get("Helicone-Model-Override") ?? null,
      promptSecurityEnabled:
        this.headers.get("Helicone-LLM-Security-Enabled") ??
        this.headers.get("Helicone-Prompt-Security-Enabled") ??
        null,
      moderationsEnabled:
        this.headers.get("Helicone-Moderations-Enabled") == "true"
          ? true
          : false,
      posthogKey: this.headers.get("Helicone-Posthog-Key") ?? null,
      lytixKey: this.headers.get("Helicone-Lytix-Key") ?? null,
      posthogHost: this.headers.get("Helicone-Posthog-Host") ?? null,
      webhookEnabled:
        this.headers.get("Helicone-Webhook-Enabled") == "true" ? true : false,
      experimentColumnId:
        this.headers.get("Helicone-Experiment-Column-Id") ?? null,
      experimentRowIndex:
        this.headers.get("Helicone-Experiment-Row-Index") ?? null,
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

  private getHeliconeProperties(
    heliconeHeaders: IHeliconeHeaders
  ): Record<string, string> {
    const propTag = "helicone-property-";
    const heliconePropertyHeaders = Object.fromEntries(
      [...this.headers.entries()]
        .filter(
          ([key]) =>
            key.toLowerCase().startsWith(propTag.toLowerCase()) &&
            key.length > propTag.length
        )
        .map(([key, value]) => [key.substring(propTag.length), value])
    );

    if (this.headers.get("Helicone-Posthog-Key")) {
      heliconePropertyHeaders["Helicone-Sent-To-Posthog"] = "true";
    }

    if (heliconeHeaders.promptHeaders.promptId) {
      heliconePropertyHeaders["Helicone-Prompt-Id"] =
        heliconeHeaders.promptHeaders.promptId;
    }
    if (heliconeHeaders.sessionHeaders.name) {
      heliconePropertyHeaders[`Helicone-Session-Name`] =
        heliconeHeaders.sessionHeaders.name;
    }
    if (heliconeHeaders.sessionHeaders.sessionId) {
      heliconePropertyHeaders["Helicone-Session-Id"] =
        heliconeHeaders.sessionHeaders.sessionId;
    }

    if (heliconeHeaders.sessionHeaders.path) {
      heliconePropertyHeaders["Helicone-Session-Path"] =
        heliconeHeaders.sessionHeaders.path;
    }

    return heliconePropertyHeaders;
  }
}
