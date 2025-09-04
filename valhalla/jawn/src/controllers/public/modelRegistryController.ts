import { Controller, Get, Route, Tags } from "tsoa";
import { err, ok, Result } from "../../packages/common/result";
import { registry } from "../../../../../packages/cost/models/registry";
import { getProviderDisplayName } from "../../../../../packages/cost/models/provider-helpers";
import {
  InputModality,
  OutputModality,
  StandardParameter,
  Endpoint,
} from "../../../../../packages/cost/models/types";

type ModelCapability =
  | "audio"
  | "video"
  | "image"
  | "thinking"
  | "web_search"
  | "caching"
  | "reasoning";

interface SimplifiedPricing {
  prompt: number;
  completion: number;
  audio?: number;
  thinking?: number;
  web_search?: number;
  image?: number;
  video?: number;
  cacheRead?: number;
  cacheWrite?: number;
  internal_reasoning?: number;
  threshold?: number;
}

interface ModelEndpoint {
  provider: string;
  providerSlug: string;
  endpoint?: Endpoint;
  supportsPtb?: boolean;
  pricing: SimplifiedPricing;
  pricingTiers?: SimplifiedPricing[];
}

interface ModelRegistryItem {
  id: string;
  name: string;
  author: string;
  contextLength: number;
  endpoints: ModelEndpoint[];
  maxOutput?: number;
  trainingDate?: string;
  description?: string;
  inputModalities: InputModality[];
  outputModalities: OutputModality[];
  supportedParameters: StandardParameter[];
}

interface ModelRegistryResponse {
  models: ModelRegistryItem[];
  total: number;
  filters: {
    providers: Array<{
      name: string;
      displayName: string;
    }>;
    authors: string[];
    capabilities: ModelCapability[];
  };
}

@Route("/v1/public/model-registry")
@Tags("Model Registry")
export class ModelRegistryController extends Controller {
  private getProviderSlug(provider: string): string {
    const slugMap: Record<string, string> = {
      openai: "openai",
      anthropic: "anthropic",
      google: "google",
      vertex: "google-vertex",
      bedrock: "aws-bedrock",
      azure: "azure",
    };
    return slugMap[provider.toLowerCase()] || provider.toLowerCase();
  }

  @Get("/models")
  public async getModelRegistry(): Promise<
    Result<ModelRegistryResponse, string>
  > {
    try {
      const allModelsResult = registry.getAllModelsWithIds();
      if (allModelsResult.error) {
        this.setStatus(500);
        return err("Failed to fetch models from registry");
      }

      const models: ModelRegistryItem[] = [];

      for (const [modelId, modelConfig] of Object.entries(
        allModelsResult.data!
      )) {
        const providerConfigsResult = registry.getModelProviderConfigs(modelId);
        if (providerConfigsResult.error || !providerConfigsResult.data) {
          continue;
        }

        const endpoints: ModelEndpoint[] = [];

        const allEndpointsResult = registry.getEndpointsByModel(modelId);

        if (allEndpointsResult.data && allEndpointsResult.data.length > 0) {
          for (const endpoint of allEndpointsResult.data) {
            const baseTier = endpoint.pricing[0];
            const simplifiedPricing: SimplifiedPricing = {
              prompt: baseTier.input * 1000000,
              completion: baseTier.output * 1000000,
              audio: baseTier.audio ? baseTier.audio * 1000000 : undefined,
              thinking: baseTier.thinking
                ? baseTier.thinking * 1000000
                : undefined,
              web_search: baseTier.web_search
                ? baseTier.web_search * 1000000
                : undefined,
              image: baseTier.image ? baseTier.image * 1000000 : undefined,
              video: baseTier.video ? baseTier.video * 1000000 : undefined,
              cacheRead: baseTier.cacheMultipliers?.cachedInput
                ? baseTier.input *
                  baseTier.cacheMultipliers.cachedInput *
                  1000000
                : undefined,
              cacheWrite: baseTier.cacheMultipliers?.write5m
                ? baseTier.input * baseTier.cacheMultipliers.write5m * 1000000
                : undefined,
              internal_reasoning: baseTier.internal_reasoning
                ? baseTier.internal_reasoning * 1000000
                : undefined,
            };

            let pricingTiers: SimplifiedPricing[] | undefined;
            if (endpoint.pricing.length > 1) {
              pricingTiers = endpoint.pricing.map((tier) => ({
                prompt: tier.input * 1000000,
                completion: tier.output * 1000000,
                audio: tier.audio ? tier.audio * 1000000 : undefined,
                thinking: tier.thinking ? tier.thinking * 1000000 : undefined,
                web_search: tier.web_search
                  ? tier.web_search * 1000000
                  : undefined,
                image: tier.image ? tier.image * 1000000 : undefined,
                video: tier.video ? tier.video * 1000000 : undefined,
                cacheRead: tier.cacheMultipliers?.cachedInput
                  ? tier.input * tier.cacheMultipliers.cachedInput * 1000000
                  : undefined,
                cacheWrite: tier.cacheMultipliers?.write5m
                  ? tier.input * tier.cacheMultipliers.write5m * 1000000
                  : undefined,
                internal_reasoning: tier.internal_reasoning
                  ? tier.internal_reasoning * 1000000
                  : undefined,
                threshold: tier.threshold,
              }));
            }

            endpoints.push({
              provider: endpoint.provider,
              providerSlug: this.getProviderSlug(endpoint.provider),
              endpoint: endpoint,
              supportsPtb: endpoint.ptbEnabled,
              pricing: simplifiedPricing,
              pricingTiers: pricingTiers,
            });
          }
        }

        if (endpoints.length === 0) {
          continue;
        }

        const structuredModality = modelConfig.modality;

        const allSupportedParameters = new Set<StandardParameter>();
        for (const config of providerConfigsResult.data) {
          config.supportedParameters.forEach((param) =>
            allSupportedParameters.add(param)
          );
        }

        models.push({
          id: modelId,
          name: modelConfig.name,
          author: modelConfig.author,
          contextLength: modelConfig.contextLength,
          endpoints,
          maxOutput: modelConfig.maxOutputTokens,
          trainingDate: modelConfig.created,
          description: modelConfig.description,
          inputModalities: structuredModality.inputs,
          outputModalities: structuredModality.outputs,
          supportedParameters: Array.from(allSupportedParameters),
        });
      }

      const availableProviders = new Set<string>();
      const availableAuthors = new Set<string>();
      const availableCapabilities = new Set<ModelCapability>();

      models.forEach((model) => {
        availableAuthors.add(model.author);
        model.endpoints.forEach((ep) => {
          availableProviders.add(ep.provider);
          if (ep.pricing.audio && ep.pricing.audio > 0)
            availableCapabilities.add("audio");
          if (ep.pricing.video && ep.pricing.video > 0)
            availableCapabilities.add("video");
          if (ep.pricing.image && ep.pricing.image > 0)
            availableCapabilities.add("image");
          if (ep.pricing.thinking && ep.pricing.thinking > 0)
            availableCapabilities.add("thinking");
          if (ep.pricing.web_search && ep.pricing.web_search > 0)
            availableCapabilities.add("web_search");
          if (
            (ep.pricing.cacheRead && ep.pricing.cacheRead > 0) ||
            (ep.pricing.cacheWrite && ep.pricing.cacheWrite > 0)
          ) {
            availableCapabilities.add("caching");
          }
        });
      });
      const providersWithDisplayNames = Array.from(availableProviders)
        .sort()
        .map((provider) => ({
          name: provider,
          displayName: getProviderDisplayName(provider),
        }));

      this.setStatus(200);
      return ok({
        models,
        total: models.length,
        filters: {
          providers: providersWithDisplayNames,
          authors: Array.from(availableAuthors).sort(),
          capabilities: Array.from(availableCapabilities).sort(),
        },
      });
    } catch (error) {
      console.error("Error fetching model registry:", error);
      this.setStatus(500);
      return err("Internal server error while fetching model registry");
    }
  }
}
