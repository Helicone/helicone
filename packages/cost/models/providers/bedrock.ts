import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@smithy/protocol-http";
import { BaseProvider } from "./base";
import type {
  ModelProviderConfig,
  UserEndpointConfig,
  AuthContext,
  AuthResult,
  RequestBodyContext,
  Endpoint,
} from "../types";

export class BedrockProvider extends BaseProvider {
  readonly baseUrl = "https://bedrock-runtime.{region}.amazonaws.com";
  readonly auth = "aws-signature" as const;
  readonly requiredConfig = ["region"] as const;
  readonly pricingPages = ["https://aws.amazon.com/bedrock/pricing/"];
  readonly modelPages = [
    "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
  ];

  private getModelId(
    endpoint: ModelProviderConfig,
    config: UserEndpointConfig = {}
  ): string {
    if (config.crossRegion && config.region && endpoint.crossRegion) {
      const regionPrefix = config.region.split("-")[0];
      return `${regionPrefix}.${endpoint.providerModelId}`;
    }
    return endpoint.providerModelId;
  }

  buildUrl(
    endpoint: ModelProviderConfig,
    config: UserEndpointConfig = {}
  ): string {
    const region = config.region || "us-east-1";
    const modelId = this.getModelId(endpoint, config);
    return `https://bedrock-runtime.${region}.amazonaws.com/model/${modelId}/invoke`;
  }

  buildModelId(
    endpoint: ModelProviderConfig,
    config: UserEndpointConfig = {}
  ): string {
    return this.getModelId(endpoint, config);
  }

  async authenticate(context: AuthContext): Promise<AuthResult> {
    if (!context.apiKey || !context.secretKey) {
      throw new Error("Bedrock requires both apiKey and secretKey");
    }

    if (!context.requestMethod || !context.requestUrl || !context.requestBody) {
      throw new Error(
        "Bedrock authentication requires requestMethod, requestUrl, and requestBody"
      );
    }

    const awsRegion = context.config?.region || "us-west-1";
    const sigv4 = new SignatureV4({
      service: "bedrock",
      region: awsRegion,
      credentials: {
        accessKeyId: context.apiKey,
        secretAccessKey: context.secretKey,
      },
      sha256: Sha256,
    });

    const headers = new Headers();
    const forwardToHost = `bedrock-runtime.${awsRegion}.amazonaws.com`;
    headers.set("host", forwardToHost);
    headers.set("content-type", "application/json");

    const url = new URL(context.requestUrl);
    const request = new HttpRequest({
      method: context.requestMethod,
      protocol: url.protocol,
      hostname: forwardToHost,
      path: url.pathname + url.search,
      headers: Object.fromEntries(headers.entries()),
      body: context.requestBody,
    });

    const signedRequest = await sigv4.sign(request);
    const signedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(signedRequest.headers)) {
      if (value) {
        signedHeaders[key] = value.toString();
      }
    }

    return { headers: signedHeaders };
  }

  buildRequestBody(endpoint: Endpoint, context: RequestBodyContext): string {
    if (endpoint.providerModelId.includes("claude-")) {
      const anthropicBody =
        context.bodyMapping === "OPENAI"
          ? context.toAnthropic(context.parsedBody)
          : context.parsedBody;
      const updatedBody = {
        ...anthropicBody,
        anthropic_version: "bedrock-2023-05-31",
        model: undefined,
      };
      return JSON.stringify(updatedBody);
    }
    return JSON.stringify(context.parsedBody);
  }
}
