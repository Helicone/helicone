import type {
  UserEndpointConfig,
  AuthContext,
  AuthResult,
  RequestBodyContext,
  Endpoint,
  RequestParams,
  ModelProviderConfig,
  ResponseFormat,
} from "../types";
import { CacheProvider } from "../../../common/cache/provider";

/**
 * Base Provider class - all methods are pure, no state mutation
 */
export abstract class BaseProvider {
  abstract readonly displayName: string;
  abstract readonly baseUrl: string;
  abstract readonly auth:
    | "api-key"
    | "oauth"
    | "aws-signature"
    | "service_account";
  abstract readonly pricingPages: string[];
  abstract readonly modelPages: string[];

  readonly requiredConfig?: ReadonlyArray<keyof UserEndpointConfig>;

  abstract buildUrl(endpoint: Endpoint, requestParams: RequestParams): string;

  buildModelId(
    modelProviderConfig: ModelProviderConfig,
    userEndpointConfig: UserEndpointConfig
  ): string {
    return modelProviderConfig.providerModelId;
  }

  authenticate(
    authContext: AuthContext,
    endpoint: Endpoint,
    cacheProvider?: CacheProvider
  ): AuthResult | Promise<AuthResult> {
    return {
      headers: {
        Authorization: `Bearer ${authContext.apiKey || ""}`,
      },
    };
  }

  buildRequestBody(
    endpoint: Endpoint,
    context: RequestBodyContext
  ): string | Promise<string> {
    return JSON.stringify({
      ...context.parsedBody,
      model: endpoint.providerModelId,
    });
  }

  async buildErrorMessage(response: Response): Promise<string> {
    try {
      const respJson = (await response.json()) as any;
      if (respJson.error?.message) {
        return respJson.error.message;
      }
      return `Request failed with status ${response.status}`;
    } catch (error) {
      return `Request failed with status ${response.status}`;
    }
  }

}
