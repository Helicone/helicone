import { $JAWN_API } from "@/lib/clients/jawn";

export interface PlaygroundModel {
  id: string;
  name: string;
  provider: string;
  providerDisplayName: string;
  author: string;
  supportsPtb: boolean;
}

export interface ModelRegistryResult {
  models: PlaygroundModel[];
  providerModelIdMap: Record<string, string>;
}

export const useModelRegistry = () => {
  return $JAWN_API.useQuery(
    "get",
    "/v1/public/model-registry/models",
    undefined,
    {
      // Map API response to the simplified PlaygroundModel[] and providerModelIdMap
      select: (result): ModelRegistryResult => {
        if (!("data" in result) || !result.data?.models) {
          return { models: [], providerModelIdMap: {} };
        }

        const playgroundModels: PlaygroundModel[] = [];
        for (const model of result.data.models) {
          if (!model.endpoints || model.endpoints.length === 0) continue;

          const primaryEndpoint =
            model.endpoints.find((ep) => ep.supportsPtb) ?? model.endpoints[0];

          playgroundModels.push({
            id: model.id,
            name: model.name,
            provider: primaryEndpoint.provider,
            providerDisplayName: primaryEndpoint.providerSlug,
            author: model.author,
            supportsPtb: primaryEndpoint.supportsPtb ?? false,
          });
        }

        const sortedModels = playgroundModels.sort((a, b) => {
          if (a.provider !== b.provider) {
            return a.provider.localeCompare(b.provider);
          }
          return a.name.localeCompare(b.name);
        });

        return {
          models: sortedModels,
          // Type assertion needed until jawn types are regenerated
          providerModelIdMap:
            (result.data as { providerModelIdMap?: Record<string, string> })
              .providerModelIdMap ?? {},
        };
      },
      staleTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false,
    },
  );
};
