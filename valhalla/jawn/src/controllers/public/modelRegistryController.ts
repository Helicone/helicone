import { Controller, Get, Query, Route, Tags } from "tsoa";
import { err, ok, Result } from "../../packages/common/result";
import { registry } from "../../../../../packages/cost/models/registry";
import { 
  InputModality, 
  OutputModality, 
  StandardParameter,
  AuthorName,
  ProviderName
} from "../../../../../packages/cost/models/types";

// Define capabilities based on ModelPricing fields
type ModelCapability = 
  | "audio"         // has pricing.audio > 0
  | "video"         // has pricing.video > 0
  | "image"         // has pricing.image > 0
  | "thinking"      // has pricing.thinking > 0
  | "web_search"    // has pricing.web_search > 0
  | "caching"       // has pricing.cacheRead or cacheWrite > 0
  | "reasoning";    // has pricing.internal_reasoning > 0

type SortOption = 'name' | 'price-low' | 'price-high' | 'context' | 'newest';

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
  total: number;
  filters: {
    providers: string[];
    authors: string[];
    capabilities: ModelCapability[];
  };
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
  public async getModelRegistry(
    // Typed filters using existing types
    @Query() providers?: string,    // Comma-separated list
    @Query() authors?: string,      // Comma-separated list
    @Query() inputModalities?: string,   // Comma-separated list
    @Query() outputModalities?: string,  // Comma-separated list
    @Query() parameters?: string,        // Comma-separated list
    @Query() capabilities?: string,      // Comma-separated list
    
    // Numeric ranges
    @Query() priceMin?: number,
    @Query() priceMax?: number,
    @Query() contextMin?: number,
    
    // Search and sorting
    @Query() search?: string,
    @Query() sort?: SortOption,
    
    // Pagination
    @Query() limit?: number,
    @Query() offset?: number
  ): Promise<Result<ModelRegistryResponse, string>> {
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

      // Parse comma-separated filter strings
      const providerList = providers?.split(',').map(p => p.trim()).filter(Boolean);
      const authorList = authors?.split(',').map(a => a.trim()).filter(Boolean);
      const inputModalityList = inputModalities?.split(',').map(m => m.trim()).filter(Boolean) as InputModality[];
      const outputModalityList = outputModalities?.split(',').map(m => m.trim()).filter(Boolean) as OutputModality[];
      const parameterList = parameters?.split(',').map(p => p.trim()).filter(Boolean) as StandardParameter[];
      const capabilityList = capabilities?.split(',').map(c => c.trim()).filter(Boolean) as ModelCapability[];

      // Apply filters
      let filteredModels = models.filter(model => {
        // Search filter
        if (search) {
          const searchLower = search.toLowerCase();
          const searchableText = [
            model.id.toLowerCase(),
            model.name.toLowerCase(),
            model.author.toLowerCase(),
            model.description?.toLowerCase() || '',
          ].join(' ');
          
          if (!searchableText.includes(searchLower)) {
            return false;
          }
        }

        // Provider filter
        if (providerList && providerList.length > 0) {
          const hasProvider = model.endpoints.some(ep => 
            providerList.some(p => ep.provider.toLowerCase() === p.toLowerCase())
          );
          if (!hasProvider) return false;
        }

        // Author filter
        if (authorList && authorList.length > 0) {
          if (!authorList.some(a => model.author.toLowerCase() === a.toLowerCase())) {
            return false;
          }
        }

        // Price filter
        if (priceMin !== undefined || priceMax !== undefined) {
          const minCost = Math.min(
            ...model.endpoints.map(e => (e.pricing.prompt + e.pricing.completion) / 2)
          );
          if (priceMin !== undefined && minCost < priceMin) return false;
          if (priceMax !== undefined && minCost > priceMax) return false;
        }

        // Context filter
        if (contextMin !== undefined && model.contextLength < contextMin) {
          return false;
        }

        // Input modality filter
        if (inputModalityList && inputModalityList.length > 0) {
          const hasModality = inputModalityList.some(m => 
            model.inputModalities.includes(m)
          );
          if (!hasModality) return false;
        }

        // Output modality filter  
        if (outputModalityList && outputModalityList.length > 0) {
          const hasModality = outputModalityList.some(m => 
            model.outputModalities.includes(m)
          );
          if (!hasModality) return false;
        }

        // Supported parameters filter
        if (parameterList && parameterList.length > 0) {
          const hasParam = parameterList.some(p => 
            model.supportedParameters.includes(p)
          );
          if (!hasParam) return false;
        }

        // Capabilities filter
        if (capabilityList && capabilityList.length > 0) {
          const modelCapabilities = new Set<ModelCapability>();
          model.endpoints.forEach(ep => {
            if (ep.pricing.audio && ep.pricing.audio > 0) modelCapabilities.add("audio");
            if (ep.pricing.video && ep.pricing.video > 0) modelCapabilities.add("video");
            if (ep.pricing.image && ep.pricing.image > 0) modelCapabilities.add("image");
            if (ep.pricing.thinking && ep.pricing.thinking > 0) modelCapabilities.add("thinking");
            if (ep.pricing.web_search && ep.pricing.web_search > 0) modelCapabilities.add("web_search");
            if ((ep.pricing.cacheRead && ep.pricing.cacheRead > 0) || 
                (ep.pricing.cacheWrite && ep.pricing.cacheWrite > 0)) {
              modelCapabilities.add("caching");
            }
          });
          
          const hasCapability = capabilityList.some(c => modelCapabilities.has(c));
          if (!hasCapability) return false;
        }

        return true;
      });

      // Apply sorting
      switch (sort) {
        case 'price-low':
          filteredModels.sort((a, b) => {
            const aMin = Math.min(...a.endpoints.map(e => (e.pricing.prompt + e.pricing.completion) / 2));
            const bMin = Math.min(...b.endpoints.map(e => (e.pricing.prompt + e.pricing.completion) / 2));
            return aMin - bMin;
          });
          break;
        case 'price-high':
          filteredModels.sort((a, b) => {
            const aMin = Math.min(...a.endpoints.map(e => (e.pricing.prompt + e.pricing.completion) / 2));
            const bMin = Math.min(...b.endpoints.map(e => (e.pricing.prompt + e.pricing.completion) / 2));
            return bMin - aMin;
          });
          break;
        case 'context':
          filteredModels.sort((a, b) => b.contextLength - a.contextLength);
          break;
        case 'newest':
          filteredModels.sort((a, b) => {
            const aDate = a.trainingDate || '';
            const bDate = b.trainingDate || '';
            return bDate.localeCompare(aDate);
          });
          break;
        case 'name':
        default:
          filteredModels.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }

      // Apply pagination
      const total = filteredModels.length;
      const startIndex = offset || 0;
      const endIndex = limit ? startIndex + limit : undefined;
      const paginatedModels = filteredModels.slice(startIndex, endIndex);

      // Collect available filter options from ALL models (not just filtered results)
      // This enables proper multi-selection in the UI
      const availableProviders = new Set<string>();
      const availableAuthors = new Set<string>();
      const availableCapabilities = new Set<ModelCapability>();
      
      models.forEach(model => {
        availableAuthors.add(model.author);
        model.endpoints.forEach(ep => {
          availableProviders.add(ep.provider);
          if (ep.pricing.audio && ep.pricing.audio > 0) availableCapabilities.add("audio");
          if (ep.pricing.video && ep.pricing.video > 0) availableCapabilities.add("video");
          if (ep.pricing.image && ep.pricing.image > 0) availableCapabilities.add("image");
          if (ep.pricing.thinking && ep.pricing.thinking > 0) availableCapabilities.add("thinking");
          if (ep.pricing.web_search && ep.pricing.web_search > 0) availableCapabilities.add("web_search");
          if ((ep.pricing.cacheRead && ep.pricing.cacheRead > 0) || 
              (ep.pricing.cacheWrite && ep.pricing.cacheWrite > 0)) {
            availableCapabilities.add("caching");
          }
        });
      });

      this.setStatus(200);
      return ok({ 
        models: paginatedModels,
        total,
        filters: {
          providers: Array.from(availableProviders).sort(),
          authors: Array.from(availableAuthors).sort(),
          capabilities: Array.from(availableCapabilities).sort(),
        }
      });
    } catch (error) {
      console.error("Error fetching model registry:", error);
      this.setStatus(500);
      return err("Internal server error while fetching model registry");
    }
  }
}