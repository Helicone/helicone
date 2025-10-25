import { useQuery } from "@tanstack/react-query";

interface ModelEndpoint {
  provider: string;
  providerSlug: string;
  supportsPtb?: boolean;
  pricing: {
    prompt: number;
    completion: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
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
  inputModalities: string[];
  outputModalities: string[];
  supportedParameters: string[];
}

interface ModelRegistryResponse {
  data: {
    models: ModelRegistryItem[];
    total: number;
    filters: {
      providers: Array<{
        name: string;
        displayName: string;
      }>;
      authors: string[];
      capabilities: string[];
    };
  };
}

export interface PlaygroundModel {
  id: string;
  name: string;
  provider: string;
  providerDisplayName: string;
  author: string;
  supportsPtb: boolean;
}

export const useModelRegistry = () => {
  return useQuery({
    queryKey: ["model-registry"],
    queryFn: async (): Promise<PlaygroundModel[]> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE}/v1/public/model-registry/models`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch model registry");
      }

      const data: ModelRegistryResponse = await response.json();

      // Transform models into playground-friendly format
      const playgroundModels: PlaygroundModel[] = [];

      for (const model of data.data.models) {
        // Only include models with at least one endpoint
        if (model.endpoints.length === 0) continue;

        // Get the primary endpoint (prefer PTB-enabled endpoints)
        const primaryEndpoint =
          model.endpoints.find(ep => ep.supportsPtb) ||
          model.endpoints[0];

        playgroundModels.push({
          id: model.id,
          name: model.name,
          provider: primaryEndpoint.provider,
          providerDisplayName: primaryEndpoint.providerSlug,
          author: model.author,
          supportsPtb: primaryEndpoint.supportsPtb ?? false,
        });
      }

      // Sort by provider, then by name
      return playgroundModels.sort((a, b) => {
        if (a.provider !== b.provider) {
          return a.provider.localeCompare(b.provider);
        }
        return a.name.localeCompare(b.name);
      });
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: false,
  });
};
