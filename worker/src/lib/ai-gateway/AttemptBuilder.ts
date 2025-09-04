import { registry } from "@helicone-package/cost/models/registry";
import { ModelProviderEntry } from "@helicone-package/cost/models/build-indexes";
import {
  ModelProviderName,
  providers,
} from "@helicone-package/cost/models/providers";
import {
  UserEndpointConfig,
  Endpoint,
} from "@helicone-package/cost/models/types";
import { ProviderKeysManager } from "../managers/ProviderKeysManager";
import { isErr, Result, ok, err } from "../util/results";
import { Attempt, ModelSpec } from "./types";
import { ProviderKey } from "../db/ProviderKeysStore";

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
        // No provider specified - try all providers
        const attempts = await this.buildAttemptsForAllProviders(
          modelSpec.data.modelName,
          orgId
        );
        allAttempts.push(...attempts);
      }
    }

    // Sort by priority (BYOK=1 before PTB=2)
    // Within each priority, endpoints are already sorted by cost from registry
    return allAttempts.sort((a, b) => a.priority - b.priority);
  }

  private async buildAttemptsForAllProviders(
    modelName: string,
    orgId: string
  ): Promise<Attempt[]> {
    // Get all provider data in one query
    const providerDataResult =
      registry.getModelProviderEntriesByModel(modelName);
    const providerData = providerDataResult.data || [];

    // Process all providers in parallel (we know model exists because parseModelString validated it)
    const attemptArrays = await Promise.all(
      providerData.map(async (data) => {
        const [byokAttempts, ptbAttempts] = await Promise.all([
          this.getByokAttempts(modelName, data, orgId),
          this.getPtbAttempts(modelName, data),
        ]);

        return [...byokAttempts, ...ptbAttempts];
      })
    );

    return attemptArrays.flat();
  }

  private async getProviderAttempts(
    modelName: string,
    provider: ModelProviderName,
    orgId: string,
    customUid?: string
  ): Promise<Attempt[]> {
    // Get provider data once
    const providerDataResult = registry.getModelProviderEntry(
      modelName,
      provider
    );
    if (!providerDataResult.data) {
      return []; // No data for this model/provider combination
    }

    const providerData = providerDataResult.data;

    // Get both BYOK and PTB attempts with provider data
    const [byokAttempts, ptbAttempts] = await Promise.all([
      this.getByokAttempts(modelName, providerData, orgId, customUid),
      this.getPtbAttempts(modelName, providerData),
    ]);

    return [...byokAttempts, ...ptbAttempts];
  }

  private async getByokAttempts(
    modelName: string,
    providerData: ModelProviderEntry,
    orgId: string,
    customUid?: string
  ): Promise<Attempt[]> {
    // Get user's provider key
    const userKey = await this.providerKeysManager.getProviderKeyWithFetch(
      providerData.provider,
      orgId,
      customUid
    );

    if (!userKey || !this.isByokEnabled(userKey)) {
      return []; // No BYOK available
    }

    const userConfig = (userKey.config as UserEndpointConfig) || {};

    // Build endpoint from provider data's config
    const endpointResult = registry.buildEndpoint(
      providerData.config,
      userConfig
    );

    if (!isErr(endpointResult) && endpointResult.data) {
      return [
        {
          endpoint: endpointResult.data,
          providerKey: userKey,
          authType: "byok",
          priority: 1,
          needsEscrow: false,
          source: `${modelName}/${providerData.provider}/byok${customUid ? `/${customUid}` : ""}`,
        },
      ];
    }

    // Passthrough: create a dynamic endpoint for unknown models
    const passthroughResult = registry.createPassthroughEndpoint(
      modelName,
      providerData.provider,
      userConfig
    );

    if (!isErr(passthroughResult) && passthroughResult.data) {
      return [
        {
          endpoint: passthroughResult.data,
          providerKey: userKey,
          authType: "byok" as const,
          priority: 1,
          needsEscrow: false,
          source: `${modelName}/${providerData.provider}/byok${customUid ? `/${customUid}` : ""}`,
        },
      ];
    }

    return [];
  }

  private async getPtbAttempts(
    modelName: string,
    providerData: ModelProviderEntry
  ): Promise<Attempt[]> {
    // Check if we have PTB endpoints
    if (providerData.ptbEndpoints.length === 0) {
      return []; // No PTB endpoints available
    }

    // Get Helicone's provider key for PTB
    const heliconeKey = await this.providerKeysManager.getProviderKeyWithFetch(
      providerData.provider,
      this.env.HELICONE_ORG_ID
    );

    if (!heliconeKey) {
      return []; // Can't do PTB without Helicone's key
    }

    // Use the helper method to build PTB attempts
    return this.buildPtbAttemptsFromEndpoints(
      modelName,
      providerData.provider,
      providerData.ptbEndpoints,
      heliconeKey
    );
  }

  private buildPtbAttemptsFromEndpoints(
    modelName: string,
    provider: ModelProviderName,
    endpoints: Endpoint[],
    providerKey: ProviderKey
  ): Attempt[] {
    return endpoints.map((endpoint) => ({
      endpoint,
      providerKey,
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

    // Just model name: "gpt-4"
    if (parts.length === 1) {
      // Check if model is known
      const validModels = registry.getAllModelIds();
      const isKnownModel =
        validModels.data && validModels.data.includes(modelName as any);

      // Fail fast: unknown model with no provider
      if (!isKnownModel) {
        return err(
          `Unknown model: ${modelName}. Please specify a provider (e.g., ${modelName}/openai) or use a supported model. See https://helicone.ai/models`
        );
      }
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
      // With provider specified, unknown models are OK (passthrough)
      // Only check and warn if needed
      const validModels = registry.getAllModelIds();
      const isKnownModel =
        validModels.data && validModels.data.includes(modelName as any);
      if (!isKnownModel) {
        console.warn(
          `Unknown model: ${modelName} - using passthrough with provider ${provider}`
        );
      }
      return ok({ modelName, provider });
    }

    if (parts.length === 3) {
      const validModels = registry.getAllModelIds();
      const isKnownModel =
        validModels.data && validModels.data.includes(modelName as any);
      if (!isKnownModel) {
        console.warn(
          `Unknown model: ${modelName} - using passthrough with provider ${provider}`
        );
      }
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
