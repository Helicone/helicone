import { registry } from "@helicone-package/cost/models/registry";
import { ModelProviderEntry } from "@helicone-package/cost/models/build-indexes";
import { ModelProviderName } from "@helicone-package/cost/models/providers";
import {
  getProviderPriority,
  sortAttemptsByPriority,
} from "@helicone-package/cost/models/providers/priorities";
import {
  UserEndpointConfig,
  Endpoint,
  Plugin,
  ModelSpec,
  BodyMappingType,
} from "@helicone-package/cost/models/types";
import { parseModelString } from "@helicone-package/cost/models/provider-helpers";
import { ProviderKeysManager } from "../managers/ProviderKeysManager";
import { isErr } from "../util/results";
import { Attempt } from "./types";
import { ProviderKey } from "../db/ProviderKeysStore";
import { PluginHandler } from "./PluginHandler";
import { DataDogTracer, TraceContext } from "../monitoring/DataDogTracer";

export class AttemptBuilder {
  private readonly pluginHandler: PluginHandler;
  private readonly tracer: DataDogTracer;
  private readonly traceContext: TraceContext | null;

  constructor(
    private readonly providerKeysManager: ProviderKeysManager,
    private readonly env: Env,
    tracer: DataDogTracer,
    traceContext: TraceContext | null
  ) {
    this.pluginHandler = new PluginHandler();
    this.tracer = tracer;
    this.traceContext = traceContext;
  }

  async buildAttempts(
    modelStrings: string[],
    orgId: string,
    bodyMapping: BodyMappingType = "OPENAI",
    plugins?: Plugin[],
    globalIgnoreProviders?: Set<ModelProviderName>
  ): Promise<Attempt[]> {
    const allAttempts: Attempt[] = [];

    for (const modelString of modelStrings) {
      const modelSpec = parseModelString(modelString);

      // Skip invalid model specs
      // TODO: Return error
      if (isErr(modelSpec)) {
        console.error(`Skipping invalid model: ${modelSpec.error}`);
        continue;
      }

      if (modelSpec.data.provider) {
        // Explicit provider specified - preserve user's order
        const providerAttempts = await this.getProviderAttempts(
          modelSpec.data,
          orgId,
          bodyMapping,
          plugins
        );
        allAttempts.push(...providerAttempts);
      } else {
        // No provider specified - get all providers and sort by priority
        const attempts = await this.buildAttemptsForAllProviders(
          modelSpec.data,
          orgId,
          bodyMapping,
          plugins,
          globalIgnoreProviders
        );
        const sortedAttempts = sortAttemptsByPriority(attempts);
        allAttempts.push(...sortedAttempts);
      }
    }

    // Filter explicit provider routing attempts (not filtered in buildAttemptsForAllProviders)
    if (globalIgnoreProviders && globalIgnoreProviders.size > 0) {
      return allAttempts.filter(
        (attempt) => !globalIgnoreProviders.has(attempt.endpoint.provider)
      );
    }

    return allAttempts;
  }

  private async buildAttemptsForAllProviders(
    modelSpec: ModelSpec,
    orgId: string,
    bodyMapping: BodyMappingType = "OPENAI",
    plugins?: Plugin[],
    globalIgnoreProviders?: Set<ModelProviderName>
  ): Promise<Attempt[]> {
    // Get all provider data in one query
    const providerDataResult = registry.getModelProviderEntriesByModel(
      modelSpec.modelName
    );
    // Filter out providers that require explicit routing (e.g., helicone)
    // and globally ignored providers
    const providerData = (providerDataResult.data || []).filter(
      (data) =>
        !data.config.requireExplicitRouting &&
        (!globalIgnoreProviders || !globalIgnoreProviders.has(data.provider))
    );

    // Process all providers in parallel (we know model exists because parseModelString validated it)
    const parallelSpan = this.traceContext?.sampled
      ? this.tracer.startSpan(
          "ai_gateway.gateway.build_attempts.process_all_providers",
          "Promise.all",
          "ai-gateway",
          {
            provider_count: providerData.length.toString(),
            model: modelSpec.modelName,
          },
          this.traceContext
        )
      : null;

    const attemptArrays = await Promise.all(
      providerData.map(async (data) => {
        const byokAttempts = await this.buildByokAttempts(
          modelSpec,
          data,
          orgId,
          bodyMapping,
          plugins
        );

        // Always build PTB attempts (feature flag removed)
        const ptbAttempts = await this.buildPtbAttempts(
          modelSpec,
          data,
          bodyMapping,
          plugins
        );
        return [...byokAttempts, ...ptbAttempts];
      })
    );

    this.tracer.finishSpan(parallelSpan);

    return attemptArrays.flat();
  }

  private async getProviderAttempts(
    modelSpec: ModelSpec,
    orgId: string,
    bodyMapping: BodyMappingType = "OPENAI",
    plugins?: Plugin[]
  ): Promise<Attempt[]> {
    // Get provider data once
    const providerDataResult = registry.getModelProviderEntry(
      modelSpec.modelName,
      modelSpec.provider as ModelProviderName
    );

    if (!providerDataResult.data) {
      // No registry data - try passthrough for unknown models
      return this.buildPassthroughAttempt(
        modelSpec,
        orgId,
        bodyMapping,
        plugins
      );
    }

    const providerData = providerDataResult.data;

    // Get BYOK attempts
    const byokAttempts = await this.buildByokAttempts(
      modelSpec,
      providerData,
      orgId,
      bodyMapping,
      plugins
    );

    // Always build PTB attempts (feature flag removed)
    const ptbAttempts = await this.buildPtbAttempts(
      modelSpec,
      providerData,
      bodyMapping,
      plugins
    );
    return [...byokAttempts, ...ptbAttempts];
  }

  private async buildByokAttempts(
    modelSpec: ModelSpec,
    providerData: ModelProviderEntry,
    orgId: string,
    bodyMapping: BodyMappingType = "OPENAI",
    plugins?: Plugin[]
  ): Promise<Attempt[]> {
    // Get user's provider key
    const keySpan = this.traceContext?.sampled
      ? this.tracer.startSpan(
          "ai_gateway.gateway.build_attempts.get_provider_key",
          "getProviderKeyWithFetch",
          "ai-gateway",
          {
            provider: providerData.provider,
            model: modelSpec.modelName,
          },
          this.traceContext
        )
      : null;

    const userKey = await this.providerKeysManager.getProviderKeyWithFetch(
      providerData.provider,
      modelSpec.modelName,
      orgId,
      modelSpec.customUid
    );

    this.tracer.finishSpan(keySpan);

    if (!userKey || !this.isByokEnabled(userKey)) {
      return []; // No BYOK available
    }

    const userConfig = {
      ...((userKey.config as UserEndpointConfig) || {}),
      gatewayMapping: bodyMapping,
      modelName: modelSpec.modelName,
    };

    // Build endpoint from provider data's config
    const endpointResult = registry.buildEndpoint(
      providerData.config,
      userConfig
    );

    if (isErr(endpointResult) || !endpointResult.data) {
      return [];
    }

    const processedPlugins = this.pluginHandler.processPlugins(
      modelSpec,
      providerData.config,
      plugins
    );

    const providerDefaultPriority = getProviderPriority(providerData.provider);

    return [
      {
        endpoint: endpointResult.data,
        providerKey: userKey,
        authType: "byok",
        priority: endpointResult.data.priority ?? providerDefaultPriority,
        source: `${modelSpec.modelName}/${providerData.provider}/byok${modelSpec.customUid ? `/${modelSpec.customUid}` : ""}`,
        plugins: processedPlugins.length > 0 ? processedPlugins : undefined,
      },
    ];
  }

  private async buildPassthroughAttempt(
    modelSpec: ModelSpec,
    orgId: string,
    bodyMapping: BodyMappingType = "OPENAI",
    plugins?: Plugin[]
  ): Promise<Attempt[]> {
    // Get user's provider key for passthrough
    const userKey = await this.providerKeysManager.getProviderKeyWithFetch(
      modelSpec.provider as ModelProviderName,
      modelSpec.modelName,
      orgId,
      modelSpec.customUid
    );

    if (!userKey || !this.isByokEnabled(userKey)) {
      return []; // No BYOK available for passthrough
    }

    const userConfig = {
      ...((userKey.config as UserEndpointConfig) || {}),
      gatewayMapping: bodyMapping,
      modelName: modelSpec.modelName,
    };

    // Create a dynamic passthrough endpoint for unknown models
    const passthroughResult = registry.createPassthroughEndpoint(
      modelSpec.modelName,
      modelSpec.provider as ModelProviderName,
      userConfig
    );

    if (!isErr(passthroughResult) && passthroughResult.data) {
      // Process plugins using PluginHandler
      const processedPlugins = this.pluginHandler.processPlugins(
        modelSpec,
        passthroughResult.data.modelConfig,
        plugins
      );

      return [
        {
          endpoint: passthroughResult.data,
          providerKey: userKey,
          authType: "byok",
          priority: passthroughResult.data.priority ?? 1,
          source: `${modelSpec.modelName}/${modelSpec.provider}/byok${modelSpec.customUid ? `/${modelSpec.customUid}` : ""}`,
          plugins: processedPlugins.length > 0 ? processedPlugins : undefined,
        },
      ];
    }

    return [];
  }

  private async buildPtbAttempts(
    modelSpec: ModelSpec,
    providerData: ModelProviderEntry,
    bodyMapping: BodyMappingType = "OPENAI",
    plugins?: Plugin[]
  ): Promise<Attempt[]> {
    // Check if we have PTB endpoints
    if (providerData.ptbEndpoints.length === 0) {
      return []; // No PTB endpoints available
    }

    // Get Helicone's provider key for PTB
    const ptbKeySpan = this.traceContext?.sampled
      ? this.tracer.startSpan(
          "ai_gateway.gateway.build_attempts.get_helicone_ptb_key",
          "getProviderKeyWithFetch",
          "ai-gateway",
          {
            provider: providerData.provider,
            model: modelSpec.modelName,
          },
          this.traceContext
        )
      : null;

    const heliconeKey = await this.providerKeysManager.getProviderKeyWithFetch(
      providerData.provider,
      providerData.config.providerModelId,
      this.env.HELICONE_ORG_ID
    );

    this.tracer.finishSpan(ptbKeySpan);

    if (!heliconeKey) {
      console.error("Can't do PTB without Helicone's key");
      return []; // Can't do PTB without Helicone's key
    }

    // Process plugins using PluginHandler
    const processedPlugins = this.pluginHandler.processPlugins(
      modelSpec,
      providerData.config,
      plugins
    );

    // Use the helper method to build PTB attempts
    return this.buildPtbAttemptsFromEndpoints(
      modelSpec.modelName,
      providerData.provider,
      providerData.ptbEndpoints,
      heliconeKey,
      bodyMapping,
      processedPlugins
    );
  }

  private buildPtbAttemptsFromEndpoints(
    modelName: string,
    provider: ModelProviderName,
    endpoints: Endpoint[],
    providerKey: ProviderKey,
    bodyMapping: BodyMappingType = "OPENAI",
    plugins?: Plugin[]
  ): Attempt[] {
    // This is where dynamically injected config is applied
    const updatedEndpoints = endpoints.map((endpoint) => {
      return {
        ...endpoint,
        userConfig: {
          ...endpoint.userConfig,
          projectId:
            (providerKey.config as UserEndpointConfig)?.projectId ||
            endpoint.userConfig.projectId,
          gatewayMapping: bodyMapping,
        },
      };
    });

    const providerDefaultPriority = getProviderPriority(provider);

    return updatedEndpoints.map(
      (endpoint) =>
        ({
          endpoint,
          providerKey,
          authType: "ptb",
          priority: endpoint.priority ?? providerDefaultPriority,
          source: `${modelName}/${provider}/ptb`,
          plugins: plugins && plugins.length > 0 ? plugins : undefined,
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
}
