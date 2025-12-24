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
    const buildAttemptsStart = performance.now();
    console.log(
      `[PERF] buildAttempts START - modelStrings: ${JSON.stringify(modelStrings)}, orgId: ${orgId}`
    );

    const allAttempts: Attempt[] = [];

    for (const modelString of modelStrings) {
      const parseStart = performance.now();
      const modelSpec = parseModelString(modelString);
      console.log(
        `[PERF] parseModelString took ${(performance.now() - parseStart).toFixed(2)}ms for "${modelString}"`
      );

      // Skip invalid model specs
      // TODO: Return error
      if (isErr(modelSpec)) {
        console.error(`Skipping invalid model: ${modelSpec.error}`);
        continue;
      }

      if (modelSpec.data.provider) {
        // Explicit provider specified - sort within this model's attempts to prioritize BYOK over PTB
        const providerAttemptsStart = performance.now();
        const providerAttempts = await this.getProviderAttempts(
          modelSpec.data,
          orgId,
          bodyMapping,
          plugins
        );
        console.log(
          `[PERF] getProviderAttempts took ${(performance.now() - providerAttemptsStart).toFixed(2)}ms for provider "${modelSpec.data.provider}"`
        );
        // Sort this model's attempts (BYOK first), but preserve order relative to other models
        allAttempts.push(...sortAttemptsByPriority(providerAttempts));
      } else {
        // No provider specified - get all providers and sort by priority
        const allProvidersStart = performance.now();
        const attempts = await this.buildAttemptsForAllProviders(
          modelSpec.data,
          orgId,
          bodyMapping,
          plugins,
          globalIgnoreProviders
        );
        console.log(
          `[PERF] buildAttemptsForAllProviders took ${(performance.now() - allProvidersStart).toFixed(2)}ms`
        );
        allAttempts.push(...sortAttemptsByPriority(attempts));
      }
    }

    // Filter explicit provider routing attempts (not filtered in buildAttemptsForAllProviders)
    if (globalIgnoreProviders && globalIgnoreProviders.size > 0) {
      const filtered = allAttempts.filter(
        (attempt) => !globalIgnoreProviders.has(attempt.endpoint.provider)
      );
      console.log(
        `[PERF] buildAttempts TOTAL took ${(performance.now() - buildAttemptsStart).toFixed(2)}ms - returned ${filtered.length} attempts`
      );
      return filtered;
    }

    console.log(
      `[PERF] buildAttempts TOTAL took ${(performance.now() - buildAttemptsStart).toFixed(2)}ms - returned ${allAttempts.length} attempts`
    );
    return allAttempts;
  }

  private async buildAttemptsForAllProviders(
    modelSpec: ModelSpec,
    orgId: string,
    bodyMapping: BodyMappingType = "OPENAI",
    plugins?: Plugin[],
    globalIgnoreProviders?: Set<ModelProviderName>
  ): Promise<Attempt[]> {
    const allProvidersStart = performance.now();

    // Get all provider data in one query
    const registryStart = performance.now();
    const providerDataResult = registry.getModelProviderEntriesByModel(
      modelSpec.modelName
    );
    console.log(
      `[PERF] registry.getModelProviderEntriesByModel took ${(performance.now() - registryStart).toFixed(2)}ms for "${modelSpec.modelName}"`
    );

    // Filter out providers that require explicit routing (e.g., helicone)
    // and globally ignored providers
    const providerData = (providerDataResult.data || []).filter(
      (data) =>
        !data.config.requireExplicitRouting &&
        (!globalIgnoreProviders || !globalIgnoreProviders.has(data.provider))
    );
    console.log(
      `[PERF] Found ${providerData.length} providers for "${modelSpec.modelName}": ${providerData.map((p) => p.provider).join(", ")}`
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

    const promiseAllStart = performance.now();
    const attemptArrays = await Promise.all(
      providerData.map(async (data) => {
        const providerStart = performance.now();

        const byokStart = performance.now();
        const byokAttempts = this.buildByokAttempts(
          modelSpec,
          data,
          orgId,
          bodyMapping,
          plugins
        );
        const byokResult = await byokAttempts;
        console.log(
          `[PERF] buildByokAttempts for ${data.provider} took ${(performance.now() - byokStart).toFixed(2)}ms - returned ${byokResult.length} attempts`
        );

        // Always build PTB attempts (feature flag removed)
        const ptbStart = performance.now();
        const ptbAttempts = this.buildPtbAttempts(
          modelSpec,
          data,
          bodyMapping,
          plugins
        );
        const ptbResult = await ptbAttempts;
        console.log(
          `[PERF] buildPtbAttempts for ${data.provider} took ${(performance.now() - ptbStart).toFixed(2)}ms - returned ${ptbResult.length} attempts`
        );

        console.log(
          `[PERF] Provider ${data.provider} total took ${(performance.now() - providerStart).toFixed(2)}ms`
        );
        return [...byokResult, ...ptbResult];
      })
    );
    console.log(
      `[PERF] Promise.all for all providers took ${(performance.now() - promiseAllStart).toFixed(2)}ms`
    );

    this.tracer.finishSpan(parallelSpan);

    console.log(
      `[PERF] buildAttemptsForAllProviders TOTAL took ${(performance.now() - allProvidersStart).toFixed(2)}ms`
    );
    return attemptArrays.flat();
  }

  private async getProviderAttempts(
    modelSpec: ModelSpec,
    orgId: string,
    bodyMapping: BodyMappingType = "OPENAI",
    plugins?: Plugin[]
  ): Promise<Attempt[]> {
    const getProviderStart = performance.now();

    // Get provider data once
    const registryStart = performance.now();
    const providerDataResult = registry.getModelProviderEntry(
      modelSpec.modelName,
      modelSpec.provider as ModelProviderName
    );
    console.log(
      `[PERF] registry.getModelProviderEntry took ${(performance.now() - registryStart).toFixed(2)}ms for "${modelSpec.modelName}/${modelSpec.provider}"`
    );

    if (!providerDataResult.data) {
      // No registry data - try passthrough for unknown models
      console.log(
        `[PERF] No registry data, trying passthrough for "${modelSpec.modelName}/${modelSpec.provider}"`
      );
      const passthroughStart = performance.now();
      const result = await this.buildPassthroughAttempt(
        modelSpec,
        orgId,
        bodyMapping,
        plugins
      );
      console.log(
        `[PERF] buildPassthroughAttempt took ${(performance.now() - passthroughStart).toFixed(2)}ms`
      );
      return result;
    }

    const providerData = providerDataResult.data;

    // Build BYOK and PTB attempts in parallel since they're independent
    const parallelStart = performance.now();
    console.log(
      `[PERF] Starting parallel BYOK/PTB build for ${modelSpec.provider}`
    );

    const byokStart = performance.now();
    const byokPromise = this.buildByokAttempts(
      modelSpec,
      providerData,
      orgId,
      bodyMapping,
      plugins
    );

    const ptbStart = performance.now();
    const ptbPromise = this.buildPtbAttempts(
      modelSpec,
      providerData,
      bodyMapping,
      plugins
    );

    const [byokAttempts, ptbAttempts] = await Promise.all([
      byokPromise,
      ptbPromise,
    ]);
    console.log(
      `[PERF] BYOK for ${modelSpec.provider} took ${(performance.now() - byokStart).toFixed(2)}ms - returned ${byokAttempts.length} attempts`
    );
    console.log(
      `[PERF] PTB for ${modelSpec.provider} took ${(performance.now() - ptbStart).toFixed(2)}ms - returned ${ptbAttempts.length} attempts`
    );
    console.log(
      `[PERF] Parallel BYOK/PTB total took ${(performance.now() - parallelStart).toFixed(2)}ms`
    );

    console.log(
      `[PERF] getProviderAttempts TOTAL took ${(performance.now() - getProviderStart).toFixed(2)}ms`
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
    const buildByokStart = performance.now();

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

    const keyFetchStart = performance.now();
    const userKey = await this.providerKeysManager.getProviderKeyWithFetch(
      providerData.provider,
      modelSpec.modelName,
      orgId,
      modelSpec.customUid
    );
    console.log(
      `[PERF] BYOK getProviderKeyWithFetch for ${providerData.provider}/${orgId} took ${(performance.now() - keyFetchStart).toFixed(2)}ms - found: ${!!userKey}`
    );

    this.tracer.finishSpan(keySpan);

    if (!userKey || !this.isByokEnabled(userKey)) {
      console.log(
        `[PERF] BYOK buildByokAttempts for ${providerData.provider} returning early (no key) - total ${(performance.now() - buildByokStart).toFixed(2)}ms`
      );
      return []; // No BYOK available
    }

    const userConfig = {
      ...((userKey.config as UserEndpointConfig) || {}),
      gatewayMapping: bodyMapping,
      modelName: modelSpec.modelName,
    };

    // Build endpoint from provider data's config
    const buildEndpointStart = performance.now();
    const endpointResult = registry.buildEndpoint(
      providerData.config,
      userConfig
    );
    console.log(
      `[PERF] BYOK registry.buildEndpoint for ${providerData.provider} took ${(performance.now() - buildEndpointStart).toFixed(2)}ms`
    );

    if (isErr(endpointResult) || !endpointResult.data) {
      console.log(
        `[PERF] BYOK buildByokAttempts for ${providerData.provider} returning early (endpoint error) - total ${(performance.now() - buildByokStart).toFixed(2)}ms`
      );
      return [];
    }

    const processedPlugins = this.pluginHandler.processPlugins(
      modelSpec,
      providerData.config,
      plugins
    );

    const providerDefaultPriority = getProviderPriority(providerData.provider);

    console.log(
      `[PERF] BYOK buildByokAttempts for ${providerData.provider} completed - total ${(performance.now() - buildByokStart).toFixed(2)}ms`
    );
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
    const buildPtbStart = performance.now();

    // Check if we have PTB endpoints
    if (providerData.ptbEndpoints.length === 0) {
      console.log(
        `[PERF] PTB buildPtbAttempts for ${providerData.provider} returning early (no PTB endpoints) - total ${(performance.now() - buildPtbStart).toFixed(2)}ms`
      );
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

    const keyFetchStart = performance.now();
    const heliconeKey = await this.providerKeysManager.getProviderKeyWithFetch(
      providerData.provider,
      providerData.config.providerModelId,
      this.env.HELICONE_ORG_ID
    );
    console.log(
      `[PERF] PTB getProviderKeyWithFetch for ${providerData.provider}/HELICONE_ORG took ${(performance.now() - keyFetchStart).toFixed(2)}ms - found: ${!!heliconeKey}`
    );

    this.tracer.finishSpan(ptbKeySpan);

    if (!heliconeKey) {
      console.error("Can't do PTB without Helicone's key");
      console.log(
        `[PERF] PTB buildPtbAttempts for ${providerData.provider} returning early (no Helicone key) - total ${(performance.now() - buildPtbStart).toFixed(2)}ms`
      );
      return []; // Can't do PTB without Helicone's key
    }

    // Process plugins using PluginHandler
    const processedPlugins = this.pluginHandler.processPlugins(
      modelSpec,
      providerData.config,
      plugins
    );

    // Use the helper method to build PTB attempts
    const result = this.buildPtbAttemptsFromEndpoints(
      modelSpec.modelName,
      providerData.provider,
      providerData.ptbEndpoints,
      heliconeKey,
      bodyMapping,
      processedPlugins
    );
    console.log(
      `[PERF] PTB buildPtbAttempts for ${providerData.provider} completed - total ${(performance.now() - buildPtbStart).toFixed(2)}ms`
    );
    return result;
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
