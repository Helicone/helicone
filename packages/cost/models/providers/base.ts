import type {
  UserEndpointConfig,
  AuthContext,
  AuthResult,
  RequestBodyContext,
  Endpoint,
  RequestParams,
  ModelProviderConfig,
  ResponseFormat,
  PluginId,
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

  // Plugins supported by this provider
  readonly supportedPlugins: PluginId[] = [];

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
    let updatedBody = context.parsedBody;
    if (context.bodyMapping === "RESPONSES") {
      updatedBody = context.toChatCompletions(updatedBody);
    }

    // Strip context_editing - only supported by specific providers (Anthropic)
    // Providers that support it should handle it in their own buildRequestBody
    const { context_editing, ...bodyWithoutContextEditing } = updatedBody;

    return JSON.stringify({
      ...bodyWithoutContextEditing,
      model: endpoint.providerModelId,
    });
  }

  async buildErrorMessage(response: Response): Promise<{
    message: string;
    details?: any;
  }> {
    try {
      const respJson = (await response.json()) as any;
      if (respJson.error?.message) {
        return { message: respJson.error.message };
      }
      return { message: `Request failed with status ${response.status}` };
    } catch (error) {
      return { message: `Request failed with status ${response.status}` };
    }
  }
}
