import { useQuery, useQueryClient } from "@tanstack/react-query";
import { $JAWN_API } from "../../lib/clients/jawn";
import type { components } from "../../lib/clients/jawnTypes/public";

type Prompt2025 = components["schemas"]["Prompt2025"];
type Prompt2025Version = components["schemas"]["Prompt2025Version"];

export interface PromptWithVersions {
  prompt: Prompt2025;
  totalVersions: number;
  versions: Prompt2025Version[];
  productionVersion: Prompt2025Version;
  majorVersions: number;
}

// TODO: Delete old prompts.tsx hooks and fix the paths here
export const useCreatePrompt = () => {
  const queryClient = useQueryClient();

  return $JAWN_API.useMutation(
    "post",
    "/v1/prompt-2025",
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["prompts"] });
      },
    }
  );
};

export const useGetPromptVersions = (promptId: string, majorVersion?: number) => {
  return useQuery<Prompt2025Version[]>({
    queryKey: ["promptVersions", promptId, majorVersion],
    refetchOnWindowFocus: false,
    // ONLY RUN IF PROMPT ID AND MAJOR VERSION ARE DEFINED
    enabled: !!promptId && majorVersion !== undefined,
    queryFn: async () => {
      const versionsResult = await $JAWN_API.POST("/v1/prompt-2025/query/versions", {
        body: {
          promptId: promptId,
          majorVersion: majorVersion,
        },
      });

      if (versionsResult.error || !versionsResult.data?.data) {
        console.error("Error fetching prompt versions:", versionsResult.error);
        return [];
      }

      return versionsResult.data.data;
    },
  });
};

export const useGetPromptsWithVersions = (
  search: string,
  page: number = 0,
  pageSize: number = 10,
) => {
  return useQuery<{
    prompts: PromptWithVersions[];
    totalCount: number;
  }>({
    queryKey: ["promptsWithVersions", search, page, pageSize],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const promptsResult = await $JAWN_API.POST("/v1/prompt-2025/query", {
        body: {
          search: search,
          page: page,
          pageSize: pageSize,
        },
      });

      if (promptsResult.error || !promptsResult.data?.data) {
        console.error("Error fetching prompts:", promptsResult.error);
        return {
          prompts: [],
          totalCount: 0,
        };
      }

      const prompts = promptsResult.data.data;

      const promptsWithVersions = await Promise.all(
        prompts.map(async (prompt): Promise<PromptWithVersions> => {
          const versionsResult = await $JAWN_API.POST("/v1/prompt-2025/query/versions", {
            body: {
              promptId: prompt.id,
            },
          });

          const totalVersionsResult = await $JAWN_API.POST("/v1/prompt-2025/query/total-versions", {
            body: {
              promptId: prompt.id,
            },
          });

          const productionVersionResult = await $JAWN_API.POST("/v1/prompt-2025/query/production-version", {
            body: {
              promptId: prompt.id,
            },
          });

          if (
            versionsResult.error ||
            !versionsResult.data?.data ||
            totalVersionsResult.error ||
            !totalVersionsResult.data?.data ||
            productionVersionResult.error ||
            !productionVersionResult.data?.data
          ) {
            console.error(
              `Error fetching versions for prompt ${prompt.id}:`,
              versionsResult.error
            );
            return {
              prompt,
              totalVersions: 0,
              versions: [],
              productionVersion: {
                id: "",
                model: "",
                prompt_id: "",
                major_version: 0,
                minor_version: 0,
                commit_message: "",
                created_at: "",
              },
              majorVersions: 0,
            };
          }

          return {
            prompt,
            totalVersions: totalVersionsResult.data.data.totalVersions,
            majorVersions: totalVersionsResult.data.data.majorVersions,
            versions: versionsResult.data.data,
            productionVersion: productionVersionResult.data.data,
          };
        })
      );


      const totalPromptsResult = await $JAWN_API.GET("/v1/prompt-2025/count", {});
      if (totalPromptsResult.error || !totalPromptsResult.data?.data) {
        console.error("Error fetching total prompts:", totalPromptsResult.error);
        return {
          prompts: [],
          totalCount: 0,
        };
      }
      return {
        prompts: promptsWithVersions,
        totalCount: totalPromptsResult.data.data,
      };

    },
  });
};