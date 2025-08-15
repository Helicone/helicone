import { ProviderName } from "./providers";
import { ModelProviderConfigId, EndpointId, ModelName } from "./registry";
import type { Endpoint, ModelProviderConfig, EndpointConfig } from "./types";

function mergeConfigs(
  base: ModelProviderConfig,
  endpointConfig: EndpointConfig
): Endpoint {
  return {
    provider: base.provider,
    providerModelId: endpointConfig.providerModelId ?? base.providerModelId,
    pricing: endpointConfig.pricing ?? base.pricing,
    contextLength: endpointConfig.contextLength ?? base.contextLength,
    maxCompletionTokens:
      endpointConfig.maxCompletionTokens ?? base.maxCompletionTokens,
    ptbEnabled: endpointConfig.ptbEnabled ?? base.ptbEnabled,
    version: endpointConfig.version ?? base.version,
    supportedParameters: base.supportedParameters,
  };
}

export function buildIndexes(
  modelProviderConfigs: Record<string, ModelProviderConfig>
): {
  endpointConfigIdToEndpointConfig: Map<
    ModelProviderConfigId,
    ModelProviderConfig
  >;
  endpointIdToEndpoint: Map<EndpointId, Endpoint>;
  modelToPtbEndpoints: Map<ModelName, Endpoint[]>;
  modelProviderIdToPtbEndpoints: Map<ModelProviderConfigId, Endpoint[]>;
  providerToModels: Map<ProviderName, Set<ModelName>>;
  modelToEndpointConfigs: Map<ModelName, ModelProviderConfig[]>;
  modelToProviders: Map<ModelName, Set<ProviderName>>;
} {
  const endpointIdToEndpoint: Map<EndpointId, Endpoint> = new Map();
  const endpointConfigIdToEndpointConfig: Map<
    ModelProviderConfigId,
    ModelProviderConfig
  > = new Map();
  const modelToPtbEndpoints: Map<ModelName, Endpoint[]> = new Map();
  const endpointConfigIdToPtbEndpoints: Map<ModelProviderConfigId, Endpoint[]> =
    new Map();
  const providerToModels: Map<ProviderName, Set<ModelName>> = new Map();
  const modelToEndpointConfigs: Map<ModelName, ModelProviderConfig[]> =
    new Map();
  const modelToProviders: Map<ModelName, Set<ProviderName>> = new Map();

  for (const [configKey, config] of Object.entries(modelProviderConfigs)) {
    const typedConfigKey = configKey as ModelProviderConfigId;
    const [modelName, provider] = configKey.split(":") as [
      ModelName,
      ProviderName,
    ];

    // Store base config for BYOK
    endpointConfigIdToEndpointConfig.set(typedConfigKey, config);

    // Track provider to models mapping
    if (!providerToModels.has(provider)) {
      providerToModels.set(provider, new Set());
    }
    providerToModels.get(provider)!.add(modelName);

    // Track model to endpoint configs mapping
    if (!modelToEndpointConfigs.has(modelName)) {
      modelToEndpointConfigs.set(modelName, []);
    }
    modelToEndpointConfigs.get(modelName)!.push(config);

    // Track model to providers mapping
    if (!modelToProviders.has(modelName)) {
      modelToProviders.set(modelName, new Set());
    }
    modelToProviders.get(modelName)!.add(provider);

    // Create an endpoint for each deployment
    for (const [deploymentId, deploymentConfig] of Object.entries(
      config.endpointConfigs
    )) {
      const endpointKey = `${configKey}:${deploymentId}` as EndpointId;
      const endpoint = mergeConfigs(config, deploymentConfig);
      endpointIdToEndpoint.set(endpointKey, endpoint);

      // Add to PTB index if enabled
      if (endpoint.ptbEnabled) {
        if (!modelToPtbEndpoints.has(modelName)) {
          modelToPtbEndpoints.set(modelName, []);
        }
        modelToPtbEndpoints.get(modelName)!.push(endpoint);

        // Also index by model:provider
        if (!endpointConfigIdToPtbEndpoints.has(typedConfigKey)) {
          endpointConfigIdToPtbEndpoints.set(typedConfigKey, []);
        }
        endpointConfigIdToPtbEndpoints.get(typedConfigKey)!.push(endpoint);
      }
    }
  }

  // Sort endpoints by cost (ascending)
  const sortByCost = (a: Endpoint, b: Endpoint) => {
    const aCost = a.pricing.prompt + a.pricing.completion;
    const bCost = b.pricing.prompt + b.pricing.completion;
    return aCost - bCost;
  };

  modelToPtbEndpoints.forEach((endpoints) => endpoints.sort(sortByCost));
  endpointConfigIdToPtbEndpoints.forEach((endpoints) =>
    endpoints.sort(sortByCost)
  );

  return {
    endpointConfigIdToEndpointConfig,
    endpointIdToEndpoint,
    modelToPtbEndpoints,
    modelProviderIdToPtbEndpoints: endpointConfigIdToPtbEndpoints,
    providerToModels,
    modelToEndpointConfigs,
    modelToProviders,
  };
}
