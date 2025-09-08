import { describe, it, expect, beforeAll } from "@jest/globals";
import { sync as globSync } from "glob";
import * as path from "path";
import { buildIndexes } from "../../cost/models/build-indexes";

// Dynamically discover and import all endpoint files
async function loadAllEndpoints() {
  const files = globSync("**/endpoints.ts", {
    cwd: path.join(__dirname, "../../cost/models/authors"),
  });

  const endpoints: Record<string, any> = {};

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
    } catch (error) {
      console.warn(`Failed to import ${file}:`, error);
    }
  }

  return endpoints;
}

describe("Registry Snapshots", () => {
  let allEndpoints: Record<string, any>;

  beforeAll(async () => {
    allEndpoints = await loadAllEndpoints();
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

  it("registry builds correctly", () => {
    // Flatten for buildIndexes
    const flat: Record<string, any> = {};
    Object.values(allEndpoints).forEach((endpoints) => {
      Object.assign(flat, endpoints);
    });

    const indexes = buildIndexes(flat);

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
    };

    expect(snapshot).toMatchSnapshot();
  });
});
