import { useQuery, useQueryClient } from "@tanstack/react-query";
import { $JAWN_API } from "../../lib/clients/jawn";
import type { components } from "../../lib/clients/jawnTypes/public";

type Prompt2025 = components["schemas"]["Prompt2025"];
type Prompt2025Version = components["schemas"]["Prompt2025Version"];

interface PromptWithVersions {
  prompt: Prompt2025;
  totalVersions: number;
  versions: Prompt2025Version[];
}

// TODO: Delete old prompts.tsx hooks and fix the paths here
export const useCreatePrompt = () => {
  const queryClient = useQueryClient();

  return $JAWN_API.useMutation(
    "post",
    "/v1/prompt-2025/create",
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["prompts"] });
      },
    }
  );
};

export const useGetPromptsWithVersions = (search: string) => {
  return useQuery<PromptWithVersions[]>({
    queryKey: ["promptsWithVersions", search],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const promptsResult = await $JAWN_API.POST("/v1/prompt-2025/query", {
        body: {
          search: search,
        },
      });

      if (promptsResult.error || !promptsResult.data?.data) {
        console.error("Error fetching prompts:", promptsResult.error);
        return [];
      }

      const prompts = promptsResult.data.data;

      const promptsWithVersions = await Promise.all(
        prompts.map(async (prompt): Promise<PromptWithVersions> => {
          const versionsResult = await $JAWN_API.POST("/v1/prompt-2025/query/versions", {
            body: {
              promptId: prompt.id,
              page: 0,
              pageSize: 10,
            },
          });

          const totalVersionsResult = await $JAWN_API.POST("/v1/prompt-2025/query/total-versions", {
            body: {
              promptId: prompt.id,
            },
          });

          if (versionsResult.error || !versionsResult.data?.data || totalVersionsResult.error || !totalVersionsResult.data?.data) {
            console.error(`Error fetching versions for prompt ${prompt.id}:`, versionsResult.error);
            return {
              prompt,
              totalVersions: 0,
              versions: [],
            };
          }

          return {
            prompt,
            totalVersions: totalVersionsResult.data.data,
            versions: versionsResult.data.data,
          };
        })
      );

      return promptsWithVersions;
    },
  });
};