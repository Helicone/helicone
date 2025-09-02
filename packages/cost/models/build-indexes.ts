import { buildEndpointUrl } from "./provider-helpers";
import { ModelProviderName } from "./providers";
import { ModelProviderConfigId, EndpointId, ModelName } from "./registry-types";
import type { Endpoint, ModelProviderConfig, EndpointConfig } from "./types";

function mergeConfigs(
  modelProviderConfig: ModelProviderConfig,
  endpointConfig: EndpointConfig,
  deploymentId: string
): Endpoint {
  const baseUrl = buildEndpointUrl(modelProviderConfig, {
    region: deploymentId,
    location: deploymentId,
    projectId: endpointConfig.projectId,
    deploymentName: endpointConfig.deploymentName,
    resourceName: endpointConfig.resourceName,
    crossRegion: endpointConfig.crossRegion,
  });

  return {
    author: modelProviderConfig.author,
    baseUrl: baseUrl.data ?? "",
    provider: modelProviderConfig.provider,
    providerModelId:
      endpointConfig.providerModelId ?? modelProviderConfig.providerModelId,
    pricing: endpointConfig.pricing ?? modelProviderConfig.pricing,
    contextLength:
      endpointConfig.contextLength ?? modelProviderConfig.contextLength,
    maxCompletionTokens:
      endpointConfig.maxCompletionTokens ??
      modelProviderConfig.maxCompletionTokens,
    ptbEnabled: endpointConfig.ptbEnabled ?? modelProviderConfig.ptbEnabled,
    version: endpointConfig.version ?? modelProviderConfig.version,
    supportedParameters: modelProviderConfig.supportedParameters,
  };
}

export interface ModelIndexes {
  endpointConfigIdToEndpointConfig: Map<
    ModelProviderConfigId,
    ModelProviderConfig
  >;
  endpointIdToEndpoint: Map<EndpointId, Endpoint>;
  modelToPtbEndpoints: Map<ModelName, Endpoint[]>;
  modelProviderIdToPtbEndpoints: Map<ModelProviderConfigId, Endpoint[]>;
  providerToModels: Map<ModelProviderName, Set<ModelName>>;
  modelToEndpointConfigs: Map<ModelName, ModelProviderConfig[]>;
  modelToProviders: Map<ModelName, Set<ModelProviderName>>;
}

export function buildIndexes(
  modelProviderConfigs: Record<string, ModelProviderConfig>
): ModelIndexes {
  const endpointIdToEndpoint: Map<EndpointId, Endpoint> = new Map();
  const endpointConfigIdToEndpointConfig: Map<
    ModelProviderConfigId,
    ModelProviderConfig
  > = new Map();
  const modelToPtbEndpoints: Map<ModelName, Endpoint[]> = new Map();
  const endpointConfigIdToPtbEndpoints: Map<ModelProviderConfigId, Endpoint[]> =
    new Map();
  const providerToModels: Map<ModelProviderName, Set<ModelName>> = new Map();
  const modelToEndpointConfigs: Map<ModelName, ModelProviderConfig[]> =
    new Map();
  const modelToProviders: Map<ModelName, Set<ModelProviderName>> = new Map();

  for (const [configKey, config] of Object.entries(modelProviderConfigs)) {
    const typedConfigKey = configKey as ModelProviderConfigId;
    const [modelName, provider] = configKey.split(":") as [
      ModelName,
      ModelProviderName,
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
      const endpoint = mergeConfigs(config, deploymentConfig, deploymentId);
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
    const aCost = (a.pricing[0]?.input ?? 0) + (a.pricing[0]?.output ?? 0);
    const bCost = (b.pricing[0]?.input ?? 0) + (b.pricing[0]?.output ?? 0);
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
