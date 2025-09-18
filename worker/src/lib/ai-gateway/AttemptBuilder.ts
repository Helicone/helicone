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
import { FeatureFlagManager } from "../managers/FeatureFlagManager";
import { isErr, Result, ok, err } from "../util/results";
import { Attempt, ModelSpec } from "./types";
import { ProviderKey } from "../db/ProviderKeysStore";

export class AttemptBuilder {
  private readonly featureFlagManager: FeatureFlagManager;

  constructor(
    private readonly providerKeysManager: ProviderKeysManager,
    private readonly env: Env
  ) {
    this.featureFlagManager = new FeatureFlagManager(env);
  }

  async buildAttempts(
    modelStrings: string[],
    orgId: string,
    bodyMapping: "OPENAI" | "NO_MAPPING" = "OPENAI"
  ): Promise<Attempt[]> {
    const allAttempts: Attempt[] = [];

    for (const modelString of modelStrings) {
      const modelSpec = this.parseModelString(modelString);

      // Skip invalid model specs
      // TODO: Return error
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
          bodyMapping,
          modelSpec.data.customUid
        );
        allAttempts.push(...providerAttempts);
      } else {
        // No provider specified - try all providers
        const attempts = await this.buildAttemptsForAllProviders(
          modelSpec.data.modelName,
          orgId,
          bodyMapping
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
    orgId: string,
    bodyMapping: "OPENAI" | "NO_MAPPING" = "OPENAI"
  ): Promise<Attempt[]> {
    // Get all provider data in one query
    const providerDataResult =
      registry.getModelProviderEntriesByModel(modelName);
    const providerData = providerDataResult.data || [];

    // Process all providers in parallel (we know model exists because parseModelString validated it)
    const attemptArrays = await Promise.all(
      providerData.map(async (data) => {
        const [byokAttempts, ptbAttempts] = await Promise.all([
          this.buildByokAttempts(modelName, data, orgId, bodyMapping),
          this.buildPtbAttempts(modelName, data),
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
    bodyMapping: "OPENAI" | "NO_MAPPING" = "OPENAI",
    customUid?: string
  ): Promise<Attempt[]> {
    // Get provider data once
    const providerDataResult = registry.getModelProviderEntry(
      modelName,
      provider
    );

    if (!providerDataResult.data) {
      // No registry data - try passthrough for unknown models
      return this.buildPassthroughAttempt(
        modelName,
        provider,
        orgId,
        bodyMapping,
        customUid
      );
    }

    const providerData = providerDataResult.data;

    // Check if credits feature is enabled for this organization
    const hasCreditsFeature = await this.featureFlagManager.hasFeature(
      orgId,
      "credits"
    );

    // Get BYOK attempts
    const byokAttempts = await this.buildByokAttempts(
      modelName,
      providerData,
      orgId,
      bodyMapping,
      customUid
    );

    // Only build PTB attempts if credits feature is enabled
    if (hasCreditsFeature) {
      const ptbAttempts = await this.buildPtbAttempts(modelName, providerData);
      return [...byokAttempts, ...ptbAttempts];
    }

    return byokAttempts;
  }

  private async buildByokAttempts(
    modelName: string,
    providerData: ModelProviderEntry,
    orgId: string,
    bodyMapping: "OPENAI" | "NO_MAPPING" = "OPENAI",
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

    const userConfig = {
      ...((userKey.config as UserEndpointConfig) || {}),
      gatewayMapping: bodyMapping,
    };

    // Build endpoint from provider data's config
    const endpointResult = registry.buildEndpoint(
      providerData.config,
      userConfig
    );

    if (isErr(endpointResult) || !endpointResult.data) {
      return [];
    }

    return [
      {
        endpoint: endpointResult.data,
        providerKey: userKey,
        authType: "byok",
        priority: 1,
        source: `${modelName}/${providerData.provider}/byok${customUid ? `/${customUid}` : ""}`,
      },
    ];
  }

  private async buildPassthroughAttempt(
    modelName: string,
    provider: ModelProviderName,
    orgId: string,
    bodyMapping: "OPENAI" | "NO_MAPPING" = "OPENAI",
    customUid?: string
  ): Promise<Attempt[]> {
    // Get user's provider key for passthrough
    const userKey = await this.providerKeysManager.getProviderKeyWithFetch(
      provider,
      orgId,
      customUid
    );

    if (!userKey || !this.isByokEnabled(userKey)) {
      return []; // No BYOK available for passthrough
    }

    const userConfig = {
      ...((userKey.config as UserEndpointConfig) || {}),
      gatewayMapping: bodyMapping,
    };

    // Create a dynamic passthrough endpoint for unknown models
    const passthroughResult = registry.createPassthroughEndpoint(
      modelName,
      provider,
      userConfig
    );

    if (!isErr(passthroughResult) && passthroughResult.data) {
      return [
        {
          endpoint: passthroughResult.data,
          providerKey: userKey,
          authType: "byok",
          priority: 1,
          source: `${modelName}/${provider}/byok${customUid ? `/${customUid}` : ""}`,
        },
      ];
    }

    return [];
  }

  private async buildPtbAttempts(
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
      console.error("Can't do PTB without Helicone's key");
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
    return endpoints.map(
      (endpoint) =>
        ({
          endpoint,
          providerKey,
          authType: "ptb",
          priority: 2,
          source: `${modelName}/${provider}/ptb`,
        }) as Attempt
    );
  }

  private isByokEnabled(providerKey: ProviderKey): boolean {
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

    return ok({
      modelName,
      provider,
      customUid: parts.length === 3 ? parts[2] : undefined,
    });
  }
}
