import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@smithy/protocol-http";
import { BaseProvider } from "./base";
import type {
  AuthContext,
  AuthResult,
  RequestBodyContext,
  Endpoint,
  RequestParams,
  ModelProviderConfig,
  UserEndpointConfig,
  ResponseFormat,
} from "../types";

export class BedrockProvider extends BaseProvider {
  readonly displayName = "AWS Bedrock";
  readonly baseUrl = "https://bedrock-runtime.{region}.amazonaws.com";
  readonly auth = "aws-signature" as const;
  readonly requiredConfig = ["region"] as const;
  readonly pricingPages = ["https://aws.amazon.com/bedrock/pricing/"];
  readonly modelPages = [
    "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
  ];

  private getModelId(
    modelProviderConfig: ModelProviderConfig,
    userEndpointConfig: UserEndpointConfig
  ): string {
    if (userEndpointConfig.crossRegion && userEndpointConfig.region) {
      const regionPrefix = userEndpointConfig.region.split("-")[0];
      return `${regionPrefix}.${modelProviderConfig.providerModelId}`;
    }
    return modelProviderConfig.providerModelId;
  }

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    const region = endpoint.userConfig.region || "us-east-1";
    const modelId = this.getModelId(endpoint.modelConfig, endpoint.userConfig);
    return `https://bedrock-runtime.${region}.amazonaws.com/model/${modelId}/invoke`;
  }

  buildModelId(
    modelProviderConfig: ModelProviderConfig,
    userEndpointConfig: UserEndpointConfig
  ): string {
    if (modelProviderConfig.author === "passthrough") {
      return modelProviderConfig.providerModelId;
    }
    return this.getModelId(modelProviderConfig, userEndpointConfig);
  }

  async authenticate(
    authContext: AuthContext,
    endpoint: Endpoint
  ): Promise<AuthResult> {
    if (!authContext.apiKey || !authContext.secretKey) {
      throw new Error("Bedrock requires both apiKey and secretKey");
    }

    if (
      !authContext.requestMethod ||
      !authContext.requestUrl ||
      !authContext.requestBody
    ) {
      throw new Error(
        "Bedrock authentication requires requestMethod, requestUrl, and requestBody"
      );
    }

    const awsRegion = endpoint.userConfig.region || "us-west-1";
    const sigv4 = new SignatureV4({
      service: "bedrock",
      region: awsRegion,
      credentials: {
        accessKeyId: authContext.apiKey,
        secretAccessKey: authContext.secretKey,
      },
      sha256: Sha256,
    });

    const headers = new Headers();
    const forwardToHost = `bedrock-runtime.${awsRegion}.amazonaws.com`;
    headers.set("host", forwardToHost);
    headers.set("content-type", "application/json");

    const url = new URL(authContext.requestUrl);
    const request = new HttpRequest({
      method: authContext.requestMethod,
      protocol: url.protocol,
      hostname: forwardToHost,
      path: url.pathname + url.search,
      headers: Object.fromEntries(headers.entries()),
      body: authContext.requestBody,
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
          ? context.toAnthropic(context.parsedBody, endpoint.providerModelId)
          : context.parsedBody;
      
      const updatedBody = {
        ...anthropicBody,
        anthropic_version: "bedrock-2023-05-31",
        model: undefined, // model is not needed in Bedrock inputs (as its defined via URL)
        stream: undefined,
      };
      return JSON.stringify(updatedBody);
    }

    // Pass through
    return JSON.stringify({
      ...context.parsedBody,
      model: endpoint.providerModelId,
    });
  }

  async buildErrorMessage(response: Response): Promise<string> {
    const respJson = (await response.json()) as any;
    if (respJson.message) {
      return respJson.message;
    }
    return `Failed request with status ${response.status}`;
  }
}
