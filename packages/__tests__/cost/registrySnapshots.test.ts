import { describe, it, expect, beforeAll } from "@jest/globals";
import { sync as globSync } from "glob";
import * as path from "path";
import { buildIndexes } from "../../cost/models/build-indexes";
import { getUsageProcessor } from "@/cost/usage/getUsageProcessor";

// Dynamically discover and import all endpoint files
async function loadAllEndpoints() {
  const files = globSync("**/endpoints.ts", {
    cwd: path.join(__dirname, "../../cost/models/authors"),
  });

  const endpoints: Record<string, any> = {};
  const archivedEndpoints: Record<string, any> = {};

  for (const file of files) {
    try {
      const [author, model] = file.split("/");
      const key = `${author}/${model}`;
      const module = await import(
        path.join(__dirname, "../../cost/models/authors", file)
      );
      if (module.endpoints) {
        endpoints[key] = module.endpoints;
      }
      if (module.archivedEndpoints) {
        archivedEndpoints[key] = module.archivedEndpoints;
      }
    } catch (error) {
      console.warn(`Failed to import ${file}:`, error);
    }
  }

  return { endpoints, archivedEndpoints };
}

describe("Registry Snapshots", () => {
  let allEndpoints: Record<string, any>;
  let allArchivedEndpoints: Record<string, any>;

  beforeAll(async () => {
    const loaded = await loadAllEndpoints();
    allEndpoints = loaded.endpoints;
    allArchivedEndpoints = loaded.archivedEndpoints;
  });

  it("pricing snapshot", () => {
    const snapshot: Record<string, any> = {};

    Object.entries(allEndpoints).forEach(([model, endpoints]) => {
      snapshot[model] = {};
      Object.entries(endpoints).forEach(([key, config]: [string, any]) => {
        const provider = key.split(":").pop()!;
        snapshot[model][provider] = config.pricing;
      });
    });

    expect(snapshot).toMatchSnapshot();
  });

  it("model coverage snapshot", () => {
    const coverage: Record<string, string[]> = {};

    Object.entries(allEndpoints).forEach(([model, endpoints]) => {
      coverage[model] = Object.keys(endpoints)
        .map((key) => key.split(":").pop()!)
        .filter(Boolean)
        .sort();
    });

    expect(coverage).toMatchSnapshot();
  });

  it("endpoint configurations snapshot", () => {
    const configs: Record<string, any> = {};

    Object.entries(allEndpoints).forEach(([model, endpoints]) => {
      configs[model] = {};
      Object.entries(endpoints).forEach(([key, config]: [string, any]) => {
        configs[model][key] = {
          provider: config.provider,
          modelId: config.providerModelId,
          context: config.contextLength,
          maxTokens: config.maxCompletionTokens,
          ptbEnabled: config.ptbEnabled,
          crossRegion: config.crossRegion || false,
          regions: Object.keys(config.endpointConfigs).sort(),
          parameters: config.supportedParameters.sort(),
        };
      });
    });

    expect(configs).toMatchSnapshot();
  });

  it("verify registry state", () => {
    // Flatten for buildIndexes
    const flat: Record<string, any> = {};
    Object.values(allEndpoints).forEach((endpoints) => {
      Object.assign(flat, endpoints);
    });

    // Flatten archived endpoints
    const flatArchived: Record<string, any> = {};
    Object.values(allArchivedEndpoints).forEach((archivedEndpoints) => {
      Object.assign(flatArchived, archivedEndpoints);
    });

    const indexes = buildIndexes(flat, flatArchived);

    // Verify all the important maps are built
    const snapshot = {
      // Total counts
      totalEndpoints: indexes.endpointIdToEndpoint.size,
      totalModelProviderConfigs: indexes.endpointConfigIdToEndpointConfig.size,
      totalProviders: indexes.providerToModels.size,
      totalModelsWithPtb: indexes.modelToPtbEndpoints.size,

      // Provider breakdown - which providers have how many models
      providerBreakdown: Array.from(indexes.providerToModels.entries())
        .map(([provider, models]) => ({ provider, modelCount: models.size }))
        .sort((a, b) => a.provider.localeCompare(b.provider)),

      // Model to providers mapping - which models are available from which providers
      modelToProviders: Array.from(indexes.modelToProviders.entries())
        .map(([model, providers]) => ({
          model,
          providers: Array.from(providers).sort(),
        }))
        .sort((a, b) => a.model.localeCompare(b.model)),

      // PTB-enabled models
      ptbEnabledModels: Array.from(indexes.modelToPtbEndpoints.keys()).sort(),

      // Sample endpoint IDs to ensure format is correct
      sampleEndpointIds: Array.from(indexes.endpointIdToEndpoint.keys())
        .sort()
        .slice(0, 5),

      // Archived endpoints index
      totalArchivedConfigs: indexes.modelToArchivedEndpointConfigs.size,

      // Sample archived endpoint keys to ensure format is correct
      sampleArchivedKeys: Array.from(indexes.modelToArchivedEndpointConfigs.keys())
        .sort()
        .slice(0, 5),
    };

    // Verify all PTB endpoints have usage processors
    const modelKeys = Array.from(indexes.modelToPtbEndpoints.keys());
    modelKeys.forEach((key) => {
      const endpoints = indexes.modelToPtbEndpoints.get(key);
      if (!endpoints) {
        throw new Error(`No endpoints found for model: ${key}`);
      }
      endpoints.forEach((endpoint) => {
        const usageProcessor = getUsageProcessor(endpoint.provider);
        if (!usageProcessor) {
          throw new Error(`Usage processor not found for provider: "${endpoint.provider}" in model: "${key}"`);
        }
      });
    });

    expect(snapshot).toMatchSnapshot();
  });

  it("archived endpoints snapshot", () => {
    const archivedSnapshot: Record<string, any> = {};

    Object.entries(allArchivedEndpoints).forEach(([model, archivedEndpoints]) => {
      if (Object.keys(archivedEndpoints).length > 0) {
        archivedSnapshot[model] = {};
        Object.entries(archivedEndpoints).forEach(([key, config]: [string, any]) => {
          archivedSnapshot[model][key] = {
            provider: config.provider,
            version: config.version,
            modelId: config.providerModelId,
            pricing: config.pricing,
          };
        });
      }
    });

    expect(archivedSnapshot).toMatchSnapshot();
  });
});
