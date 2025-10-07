// Import shared types from packages
import { 
  InputModality, 
  OutputModality, 
  StandardParameter 
} from "../../../packages/cost/models/types";
import { getProviderDisplayName } from "../../../packages/cost/models/provider-helpers";

// Define filtering-specific types
export type ModelCapability =
  | "audio"
  | "video"
  | "image"
  | "thinking"
  | "web_search"
  | "caching"
  | "reasoning";


export type SortOption = 
  | "name" 
  | "price-low" 
  | "price-high" 
  | "context" 
  | "newest";

export interface ModelEndpoint {
  provider: string;
  providerSlug: string;
  pricing: {
    prompt: number;
    completion: number;
    audio?: number;
    web_search?: number;
    video?: number;
    image?: number;
    thinking?: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
  supportsPtb?: boolean;
}

export interface Model {
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

export interface FilterOptions {
  search?: string;
  providers?: Set<string>;
  priceRange?: [number, number];
  minContextSize?: number;
  capabilities?: Set<string>;
  authors?: Set<string>;
  inputModalities?: Set<InputModality>;
  outputModalities?: Set<OutputModality>;
  parameters?: Set<StandardParameter>;
  showPtbOnly?: boolean;
}

// Search filter
export const filterBySearch = (models: Model[], search: string): Model[] => {
  if (!search) return models;
  
  const searchLower = search.toLowerCase();
  return models.filter(model => {
    const searchableText = [
      model.id.toLowerCase(),
      model.name.toLowerCase(),
      model.author.toLowerCase(),
      model.description?.toLowerCase() || '',
    ].join(' ');
    
    return searchableText.includes(searchLower);
  });
};

// Provider filter
export const filterByProviders = (models: Model[], providers: Set<string>): Model[] => {
  if (!providers.size) return models;
  
  return models.filter(model => 
    model.endpoints.some(ep => 
      Array.from(providers).some(p => 
        ep.provider.toLowerCase() === p.toLowerCase()
      )
    )
  );
};

// Author filter
export const filterByAuthors = (models: Model[], authors: Set<string>): Model[] => {
  if (!authors.size) return models;
  
  return models.filter(model => 
    Array.from(authors).some(a => 
      model.author.toLowerCase() === a.toLowerCase()
    )
  );
};

// Price filter
export const filterByPrice = (models: Model[], priceRange: [number, number]): Model[] => {
  const [priceMin, priceMax] = priceRange;
  
  return models.filter(model => {
    const minCost = Math.min(
      ...model.endpoints.map(e => (e.pricing.prompt + e.pricing.completion) / 2)
    );
    return minCost >= priceMin && minCost <= priceMax;
  });
};

// Context size filter
export const filterByContextSize = (models: Model[], minContextSize: number): Model[] => {
  if (minContextSize <= 0) return models;
  
  return models.filter(model => model.contextLength >= minContextSize);
};

// Input modality filter
export const filterByInputModalities = (models: Model[], inputModalities: Set<InputModality>): Model[] => {
  if (!inputModalities.size) return models;
  
  return models.filter(model => 
    Array.from(inputModalities).some(m => 
      model.inputModalities.includes(m)
    )
  );
};

// Output modality filter  
export const filterByOutputModalities = (models: Model[], outputModalities: Set<OutputModality>): Model[] => {
  if (!outputModalities.size) return models;
  
  return models.filter(model => 
    Array.from(outputModalities).some(m => 
      model.outputModalities.includes(m)
    )
  );
};

// Parameters filter
export const filterByParameters = (models: Model[], parameters: Set<StandardParameter>): Model[] => {
  if (!parameters.size) return models;
  
  return models.filter(model => 
    Array.from(parameters).some(p => 
      model.supportedParameters.includes(p)
    )
  );
};

// Capabilities filter
export const filterByCapabilities = (models: Model[], capabilities: Set<string>): Model[] => {
  if (!capabilities.size) return models;

  return models.filter(model => {
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

    return Array.from(capabilities).some(c => modelCapabilities.has(c as ModelCapability));
  });
};

// PTB filter
export const filterByPtb = (models: Model[], showPtbOnly: boolean): Model[] => {
  if (!showPtbOnly) return models;

  // Only models with at least one PTB-enabled endpoint
  return models.filter(model =>
    model.endpoints.some(ep => ep.supportsPtb)
  );
};

// Sort models
export const sortModels = (models: Model[], sortBy: SortOption): Model[] => {
  const sorted = [...models];
  
  switch (sortBy) {
    case 'price-low':
      return sorted.sort((a, b) => {
        const aMin = Math.min(...a.endpoints.map(e => (e.pricing.prompt + e.pricing.completion) / 2));
        const bMin = Math.min(...b.endpoints.map(e => (e.pricing.prompt + e.pricing.completion) / 2));
        return aMin - bMin;
      });
      
    case 'price-high':
      return sorted.sort((a, b) => {
        const aMin = Math.min(...a.endpoints.map(e => (e.pricing.prompt + e.pricing.completion) / 2));
        const bMin = Math.min(...b.endpoints.map(e => (e.pricing.prompt + e.pricing.completion) / 2));
        return bMin - aMin;
      });
      
    case 'context':
      return sorted.sort((a, b) => b.contextLength - a.contextLength);
      
    case 'newest':
      return sorted.sort((a, b) => {
        const aDate = a.trainingDate || '';
        const bDate = b.trainingDate || '';
        return bDate.localeCompare(aDate);
      });
      
    case 'name':
    default:
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
};

// Composite filter function
export const applyFilters = (models: Model[], options: FilterOptions): Model[] => {
  let filtered = models;

  // Apply each filter in sequence
  if (options.search) {
    filtered = filterBySearch(filtered, options.search);
  }

  if (options.providers && options.providers.size > 0) {
    filtered = filterByProviders(filtered, options.providers);
  }

  if (options.authors && options.authors.size > 0) {
    filtered = filterByAuthors(filtered, options.authors);
  }

  if (options.priceRange) {
    filtered = filterByPrice(filtered, options.priceRange);
  }

  if (options.minContextSize && options.minContextSize > 0) {
    filtered = filterByContextSize(filtered, options.minContextSize);
  }

  if (options.inputModalities && options.inputModalities.size > 0) {
    filtered = filterByInputModalities(filtered, options.inputModalities);
  }

  if (options.outputModalities && options.outputModalities.size > 0) {
    filtered = filterByOutputModalities(filtered, options.outputModalities);
  }

  if (options.parameters && options.parameters.size > 0) {
    filtered = filterByParameters(filtered, options.parameters);
  }

  if (options.capabilities && options.capabilities.size > 0) {
    filtered = filterByCapabilities(filtered, options.capabilities);
  }

  if (options.showPtbOnly) {
    filtered = filterByPtb(filtered, options.showPtbOnly);
  }

  return filtered;
};

// Provider type with display name
export interface Provider {
  name: string;
  displayName: string;
}

// Extract available filter options from models
export const extractAvailableFilters = (models: Model[]) => {
  const providersMap = new Map<string, string>();
  const authors = new Set<string>();
  const capabilities = new Set<ModelCapability>();

  models.forEach(model => {
    authors.add(model.author);

    model.endpoints.forEach(ep => {
      if (!providersMap.has(ep.provider)) {
        const displayName = getProviderDisplayName(ep.provider);
        providersMap.set(ep.provider, displayName);
      }

      if (ep.pricing.audio && ep.pricing.audio > 0) capabilities.add("audio");
      if (ep.pricing.video && ep.pricing.video > 0) capabilities.add("video");
      if (ep.pricing.image && ep.pricing.image > 0) capabilities.add("image");
      if (ep.pricing.thinking && ep.pricing.thinking > 0) capabilities.add("thinking");
      if (ep.pricing.web_search && ep.pricing.web_search > 0) capabilities.add("web_search");
      if ((ep.pricing.cacheRead && ep.pricing.cacheRead > 0) ||
          (ep.pricing.cacheWrite && ep.pricing.cacheWrite > 0)) {
        capabilities.add("caching");
      }
    });
  });
  
  // Convert to array of provider objects
  const providers = Array.from(providersMap.entries())
    .map(([name, displayName]) => ({ name, displayName }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  
  return {
    providers,
    authors: Array.from(authors).sort(),
    capabilities: Array.from(capabilities).sort(),
  };
};