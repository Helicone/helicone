import { Controller, Get, Route, Tags } from "tsoa";
import { err, ok, Result } from "../../packages/common/result";
import { registry } from "../../../../../packages/cost/models/registry";
import { 
  InputModality, 
  OutputModality, 
  StandardParameter,
  ModelPricing,
  Endpoint
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

interface SimplifiedPricing {
  prompt: number;  // per million tokens
  completion: number;  // per million tokens
  audio?: number;
  thinking?: number;
  web_search?: number;
  image?: number;
  video?: number;
  cacheRead?: number;
  cacheWrite?: number;
  internal_reasoning?: number;
  threshold?: number;  // Add threshold for tiers
}

interface ModelEndpoint {
  provider: string;
  providerSlug: string;
  endpoint?: Endpoint; // Direct from package
  supportsPtb?: boolean;
  pricing: SimplifiedPricing;  // Base pricing (simplified)
  pricingTiers?: SimplifiedPricing[];  // Full tiers with thresholds
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

  // Helper function to get display name for providers
  private getProviderDisplayName(provider: string): string {
    const displayNameMap: Record<string, string> = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'google': 'Google AI Studio',
      'vertex': 'Vertex AI',
      'bedrock': 'AWS Bedrock',
      'azure-openai': 'Azure OpenAI',
      'perplexity': 'Perplexity',
      'groq': 'Groq',
      'deepseek': 'DeepSeek',
      'cohere': 'Cohere',
      'xai': 'xAI',
    };
    return displayNameMap[provider.toLowerCase()] || provider;
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
        
        // Get PTB endpoints directly from registry
        const ptbEndpointsResult = registry.getPtbEndpoints(modelId);
        
        if (ptbEndpointsResult.data && ptbEndpointsResult.data.length > 0) {
          // Use PTB endpoints directly - they already have the correct structure
          for (const endpoint of ptbEndpointsResult.data) {
            // Convert to simplified pricing format
            const baseTier = endpoint.pricing[0];
            const simplifiedPricing: SimplifiedPricing = {
              prompt: baseTier.input * 1000000,
              completion: baseTier.output * 1000000,
              audio: baseTier.audio ? baseTier.audio * 1000000 : undefined,
              thinking: baseTier.thinking ? baseTier.thinking * 1000000 : undefined,
              web_search: baseTier.web_search ? baseTier.web_search * 1000000 : undefined,
              image: baseTier.image ? baseTier.image * 1000000 : undefined,
              video: baseTier.video ? baseTier.video * 1000000 : undefined,
              cacheRead: baseTier.cacheMultipliers?.read ? baseTier.input * baseTier.cacheMultipliers.read * 1000000 : undefined,
              cacheWrite: baseTier.cacheMultipliers?.write5m ? baseTier.input * baseTier.cacheMultipliers.write5m * 1000000 : undefined,
              internal_reasoning: baseTier.internal_reasoning ? baseTier.internal_reasoning * 1000000 : undefined,
            };

            // Create pricing tiers if there are multiple
            let pricingTiers: SimplifiedPricing[] | undefined;
            if (endpoint.pricing.length > 1) {
              pricingTiers = endpoint.pricing.map(tier => ({
                prompt: tier.input * 1000000,
                completion: tier.output * 1000000,
                audio: tier.audio ? tier.audio * 1000000 : undefined,
                thinking: tier.thinking ? tier.thinking * 1000000 : undefined,
                web_search: tier.web_search ? tier.web_search * 1000000 : undefined,
                image: tier.image ? tier.image * 1000000 : undefined,
                video: tier.video ? tier.video * 1000000 : undefined,
                cacheRead: tier.cacheMultipliers?.read ? tier.input * tier.cacheMultipliers.read * 1000000 : undefined,
                cacheWrite: tier.cacheMultipliers?.write5m ? tier.input * tier.cacheMultipliers.write5m * 1000000 : undefined,
                internal_reasoning: tier.internal_reasoning ? tier.internal_reasoning * 1000000 : undefined,
                threshold: tier.threshold,  // Include threshold!
              }));
            }

            endpoints.push({
              provider: endpoint.provider,
              providerSlug: this.getProviderSlug(endpoint.provider),
              endpoint: endpoint, // Still pass the entire endpoint object
              supportsPtb: true,
              pricing: simplifiedPricing,
              pricingTiers: pricingTiers,
            });
          }
        } else {
          // Fallback: get provider configs if no PTB endpoints
          for (const config of providerConfigsResult.data) {
            // Convert to simplified pricing format
            const baseTier = config.pricing[0];
            const simplifiedPricing: SimplifiedPricing = {
              prompt: baseTier.input * 1000000,
              completion: baseTier.output * 1000000,
              audio: baseTier.audio ? baseTier.audio * 1000000 : undefined,
              thinking: baseTier.thinking ? baseTier.thinking * 1000000 : undefined,
              web_search: baseTier.web_search ? baseTier.web_search * 1000000 : undefined,
              image: baseTier.image ? baseTier.image * 1000000 : undefined,
              video: baseTier.video ? baseTier.video * 1000000 : undefined,
              cacheRead: baseTier.cacheMultipliers?.read ? baseTier.input * baseTier.cacheMultipliers.read * 1000000 : undefined,
              cacheWrite: baseTier.cacheMultipliers?.write5m ? baseTier.input * baseTier.cacheMultipliers.write5m * 1000000 : undefined,
              internal_reasoning: baseTier.internal_reasoning ? baseTier.internal_reasoning * 1000000 : undefined,
            };

            // Create pricing tiers if there are multiple
            let pricingTiers: SimplifiedPricing[] | undefined;
            if (config.pricing.length > 1) {
              pricingTiers = config.pricing.map(tier => ({
                prompt: tier.input * 1000000,
                completion: tier.output * 1000000,
                audio: tier.audio ? tier.audio * 1000000 : undefined,
                thinking: tier.thinking ? tier.thinking * 1000000 : undefined,
                web_search: tier.web_search ? tier.web_search * 1000000 : undefined,
                image: tier.image ? tier.image * 1000000 : undefined,
                video: tier.video ? tier.video * 1000000 : undefined,
                cacheRead: tier.cacheMultipliers?.read ? tier.input * tier.cacheMultipliers.read * 1000000 : undefined,
                cacheWrite: tier.cacheMultipliers?.write5m ? tier.input * tier.cacheMultipliers.write5m * 1000000 : undefined,
                internal_reasoning: tier.internal_reasoning ? tier.internal_reasoning * 1000000 : undefined,
                threshold: tier.threshold,  // Include threshold!
              }));
            }

            endpoints.push({
              provider: config.provider,
              providerSlug: this.getProviderSlug(config.provider),
              supportsPtb: config.ptbEnabled,
              pricing: simplifiedPricing,
              pricingTiers: pricingTiers,
            });
          }
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

      // Collect available filter options from ALL models
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

      // Map providers to include display names
      const providersWithDisplayNames = Array.from(availableProviders)
        .sort()
        .map(provider => ({
          name: provider,
          displayName: this.getProviderDisplayName(provider),
        }));

      this.setStatus(200);
      return ok({ 
        models,
        total: models.length,
        filters: {
          providers: providersWithDisplayNames,
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