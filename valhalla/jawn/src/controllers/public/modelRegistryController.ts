import { Controller, Get, Route, Tags } from "tsoa";
import { err, ok, Result } from "../../packages/common/result";
import { registry } from "../../../../../packages/cost/models/registry";
import { InputModality, OutputModality, StandardParameter } from "../../../../../packages/cost/models/types";

interface ModelEndpoint {
  provider: string;
  providerSlug: string;
  pricing: {
    prompt: number;      // per million tokens
    completion: number;  // per million tokens
    audio?: number;      // per million tokens, if > 0
    web_search?: number; // per million tokens, if > 0
    video?: number;      // per million tokens, if > 0
    image?: number;      // per million tokens, if > 0
    thinking?: number;   // per million tokens, if > 0
    cacheRead?: number;  // per million tokens, if > 0
    cacheWrite?: number; // per million tokens, if > 0
  };
  supportsPtb?: boolean;
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
}

@Route("/v1/public/model-registry")
@Tags("Model Registry")
export class ModelRegistryController extends Controller {
  // Helper function to format cost per million tokens
  private formatCostPerMillion(costPerToken: number): number {
    return costPerToken * 1000000;
  }

  // Helper function to get provider slug for linking
  private getProviderSlug(provider: string): string {
    const slugMap: Record<string, string> = {
      'openai': 'openai',
      'anthropic': 'anthropic',
      'google': 'google',
      'vertex': 'google-vertex',
      'bedrock': 'aws-bedrock',
      'azure': 'azure-openai',
    };
    return slugMap[provider.toLowerCase()] || provider.toLowerCase();
  }

  @Get("/models")
  public async getModelRegistry(): Promise<Result<ModelRegistryResponse, string>> {
    try {
      // Get all models from the registry
      const allModelsResult = registry.getAllModelsWithIds();
      if (allModelsResult.error) {
        this.setStatus(500);
        return err("Failed to fetch models from registry");
      }

      const models: ModelRegistryItem[] = [];
      
      // Transform each model into the API response format
      for (const [modelId, modelConfig] of Object.entries(allModelsResult.data!)) {
        // Get all provider configs for this model
        const providerConfigsResult = registry.getModelProviderConfigs(modelId);
        if (providerConfigsResult.error || !providerConfigsResult.data) {
          continue; // Skip models without provider configs
        }

        const endpoints: ModelEndpoint[] = [];
        
        // Transform each provider config into an endpoint
        for (const config of providerConfigsResult.data) {
          // Get PTB endpoints for cost information
          const ptbEndpointsResult = registry.getPtbEndpointsByProvider(modelId, config.provider);
          
          // Use PTB endpoint pricing if available, otherwise use config pricing
          const sourcePricing = ptbEndpointsResult.data && ptbEndpointsResult.data.length > 0
            ? ptbEndpointsResult.data[0].pricing
            : config.pricing;

          // Convert all costs to per-million tokens and only include if > 0
          const pricing: any = {
            prompt: this.formatCostPerMillion(sourcePricing.prompt),
            completion: this.formatCostPerMillion(sourcePricing.completion),
          };

          // Add optional cost metrics only if they exist and are > 0
          if (sourcePricing.audio && sourcePricing.audio > 0) {
            pricing.audio = this.formatCostPerMillion(sourcePricing.audio);
          }
          if (sourcePricing.web_search && sourcePricing.web_search > 0) {
            pricing.web_search = this.formatCostPerMillion(sourcePricing.web_search);
          }
          if (sourcePricing.video && sourcePricing.video > 0) {
            pricing.video = this.formatCostPerMillion(sourcePricing.video);
          }
          if (sourcePricing.image && sourcePricing.image > 0) {
            pricing.image = this.formatCostPerMillion(sourcePricing.image);
          }
          if (sourcePricing.thinking && sourcePricing.thinking > 0) {
            pricing.thinking = this.formatCostPerMillion(sourcePricing.thinking);
          }
          if (sourcePricing.cacheRead && sourcePricing.cacheRead > 0) {
            pricing.cacheRead = this.formatCostPerMillion(sourcePricing.cacheRead);
          }
          if (sourcePricing.cacheWrite && sourcePricing.cacheWrite > 0) {
            const cacheWriteCost = typeof sourcePricing.cacheWrite === 'number' 
              ? sourcePricing.cacheWrite 
              : sourcePricing.cacheWrite.default;
            pricing.cacheWrite = this.formatCostPerMillion(cacheWriteCost);
          }

          endpoints.push({
            provider: config.provider,
            providerSlug: this.getProviderSlug(config.provider),
            pricing,
            supportsPtb: config.ptbEnabled,
          });
        }

        // Skip models without endpoints
        if (endpoints.length === 0) {
          continue;
        }

        // Extract modality information
        const structuredModality = modelConfig.modality;
        
        // Collect all unique supported parameters from all provider configs
        const allSupportedParameters = new Set<StandardParameter>();
        for (const config of providerConfigsResult.data) {
          config.supportedParameters.forEach(param => allSupportedParameters.add(param));
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

      // Sort models by name
      models.sort((a, b) => a.name.localeCompare(b.name));

      this.setStatus(200);
      return ok({ models });
    } catch (error) {
      console.error("Error fetching model registry:", error);
      this.setStatus(500);
      return err("Internal server error while fetching model registry");
    }
  }
}