import { registry } from "@helicone-package/cost/models/registry";
import {
  ModelProviderName,
  providers,
} from "@helicone-package/cost/models/providers";
import { UserEndpointConfig } from "@helicone-package/cost/models/types";
import { ProviderKeysManager } from "../managers/ProviderKeysManager";
import { isErr, Result, ok, err } from "../util/results";
import { Attempt, ModelSpec } from "./types";

export class AttemptBuilder {
  constructor(
    private readonly providerKeysManager: ProviderKeysManager,
    private readonly env: Env
  ) {}

  async buildAttempts(
    modelStrings: string[],
    orgId: string
  ): Promise<Attempt[]> {
    const allAttempts: Attempt[] = [];

    for (const modelString of modelStrings) {
      const modelSpec = this.parseModelString(modelString);

      // Skip invalid model specs
      if (isErr(modelSpec)) {
        console.error(`Skipping invalid model: ${modelSpec.error}`);
        continue;
      }

      if (modelSpec.data.provider) {
        // Explicit provider specified - only try this provider
        const providerAttempts = await this.getProviderAttempts(
          modelSpec.data.modelName,
          modelSpec.data.provider,
          orgId,
          modelSpec.data.customUid
        );
        allAttempts.push(...providerAttempts);
      } else {
        // No provider specified - try all providers that support this model
        const providersResult = registry.getModelProviders(
          modelSpec.data.modelName
        );
        const providers = providersResult.data || new Set();

        for (const provider of providers) {
          const providerAttempts = await this.getProviderAttempts(
            modelSpec.data.modelName,
            provider,
            orgId
          );
          allAttempts.push(...providerAttempts);
        }
      }
    }

    // Sort by priority (BYOK=1 before PTB=2)
    // Within each priority, endpoints are already sorted by cost from registry
    return allAttempts.sort((a, b) => a.priority - b.priority);
  }

  private async getProviderAttempts(
    modelName: string,
    provider: ModelProviderName,
    orgId: string,
    customUid?: string
  ): Promise<Attempt[]> {
    // Get both BYOK and PTB attempts
    const [byokAttempts, ptbAttempts] = await Promise.all([
      this.getByokAttempts(modelName, provider, orgId, customUid),
      this.getPtbAttempts(modelName, provider, orgId, customUid),
    ]);

    return [...byokAttempts, ...ptbAttempts];
  }

  private async getByokAttempts(
    modelName: string,
    provider: ModelProviderName,
    orgId: string,
    customUid?: string
  ): Promise<Attempt[]> {
    // Get user's provider key
    const userKey = await this.providerKeysManager.getProviderKeyWithFetch(
      provider,
      orgId,
      customUid
    );

    if (!userKey || !this.isByokEnabled(userKey)) {
      return []; // No BYOK available
    }

    // Get endpoints from registry (already sorted by cost!)
    let endpoints = (registry.getEndpointsByModel(modelName).data || []).filter(
      (e) => e.provider === provider
    );

    // If no endpoints exist, try to create a fallback
    if (endpoints.length === 0) {
      const userConfig = (userKey.config as UserEndpointConfig) || {};
      const fallbackResult = registry.createFallbackEndpoint(
        modelName,
        provider,
        userConfig
      );

      if (!isErr(fallbackResult) && fallbackResult.data) {
        endpoints = [fallbackResult.data];
      }
    }

    // Return BYOK attempt for each endpoint
    return endpoints.map((endpoint) => ({
      endpoint,
      providerKey: userKey,
      authType: "byok" as const,
      priority: 1,
      needsEscrow: false,
      source: `${modelName}/${provider}/byok${customUid ? `/${customUid}` : ""}`,
    }));
  }

  private async getPtbAttempts(
    modelName: string,
    provider: ModelProviderName,
    orgId: string,
    customUid?: string
  ): Promise<Attempt[]> {
    // Get PTB-enabled endpoints (already sorted by cost!)
    const ptbEndpoints =
      registry.getPtbEndpoints(modelName, provider).data || [];

    if (ptbEndpoints.length === 0) {
      return []; // No PTB endpoints available
    }

    // Get Helicone's provider key for PTB
    const heliconeKey = await this.providerKeysManager.getProviderKeyWithFetch(
      provider,
      this.env.HELICONE_ORG_ID
    );

    if (!heliconeKey) {
      return []; // Can't do PTB without Helicone's key
    }

    // Check if user has a key (for config merging)
    const userKey = await this.providerKeysManager.getProviderKeyWithFetch(
      provider,
      orgId,
      customUid
    );

    // Merge keys: use Helicone's credentials but preserve user's config
    const mergedKey = userKey
      ? {
          ...userKey,
          decrypted_provider_key: heliconeKey.decrypted_provider_key,
          decrypted_provider_secret_key:
            heliconeKey.decrypted_provider_secret_key,
        }
      : heliconeKey;

    // Return PTB attempt for each endpoint
    return ptbEndpoints.map((endpoint) => ({
      endpoint,
      providerKey: mergedKey,
      authType: "ptb" as const,
      priority: 2,
      needsEscrow: true,
      source: `${modelName}/${provider}/ptb`,
    }));
  }

  private isByokEnabled(providerKey: any): boolean {
    // Legacy support: if byok_enabled is not set, assume true
    return (
      providerKey.byok_enabled === undefined ||
      providerKey.byok_enabled === null ||
      providerKey.byok_enabled === true
    );
  }

  private validateProvider(provider: string): provider is ModelProviderName {
    return provider in providers;
  }

  parseModelString(modelString: string): Result<ModelSpec, string> {
    const parts = modelString.split("/");
    const modelName = parts[0];

    const validModels = registry.getAllModelIds();
    if (validModels.data && !validModels.data.includes(modelName as any)) {
      console.warn(`Unknown model: ${modelName} - continuing for BYOK support`);
      // TODO: Once model registry is comprehensive, return error instead:
      // return { error: `Unknown model: ${modelName}. See supported models at https://helicone.ai/models` };
    }

    // Just model name: "gpt-4"
    if (parts.length === 1) {
      return ok({ modelName });
    }

    // Has provider - validate it once
    const provider = parts[1];
    if (!this.validateProvider(provider)) {
      const validProviders = Object.keys(providers);
      return err(
        `Invalid provider: ${provider}. Valid providers: ${validProviders.join(", ")}`
      );
    }

    // Model with provider: "gpt-4/openai"
    if (parts.length === 2) {
      return ok({ modelName, provider });
    }

    // Model with provider and custom UID: "gpt-4/openai/custom-123"
    if (parts.length === 3) {
      return ok({
        modelName,
        provider,
        customUid: parts[2],
      });
    }

    // Invalid format (too many parts), treat as model name only
    return ok({ modelName: modelString });
  }
}
