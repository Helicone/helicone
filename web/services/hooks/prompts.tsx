import { useQuery, useQueryClient } from "@tanstack/react-query";
import { $JAWN_API } from "../../lib/clients/jawn";
import type { components } from "../../lib/clients/jawnTypes/public";
import type { OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import { logger } from "@/lib/telemetry/logger";

type Prompt2025 = components["schemas"]["Prompt2025"];
type Prompt2025Version = components["schemas"]["Prompt2025Version"];
type Prompt2025Input = components["schemas"]["Prompt2025Input"];

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

  return $JAWN_API.useMutation("post", "/v1/prompt-2025", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      queryClient.invalidateQueries({ queryKey: ["promptTags"] });
      queryClient.invalidateQueries({ queryKey: ["promptEnvironments"] });
    },
  });
};

export const useRenamePrompt = () => {
  const queryClient = useQueryClient();

  return $JAWN_API.useMutation("post", "/v1/prompt-2025/id/{promptId}/rename", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      queryClient.invalidateQueries({ queryKey: ["promptsWithVersions"] });
      queryClient.invalidateQueries({ queryKey: ["promptTags"] });
      queryClient.invalidateQueries({ queryKey: ["promptVersions"] });
      queryClient.invalidateQueries({ queryKey: ["promptVersionWithBody"] });
    },
  });
};

export const useUpdatePromptTags = () => {
  const queryClient = useQueryClient();

  return $JAWN_API.useMutation("patch", "/v1/prompt-2025/id/{promptId}/tags", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      queryClient.invalidateQueries({ queryKey: ["promptsWithVersions"] });
      queryClient.invalidateQueries({ queryKey: ["promptTags"] });
      queryClient.invalidateQueries({ queryKey: ["promptVersionWithBody"] });
    },
  });
};

export const usePushPromptVersion = () => {
  const queryClient = useQueryClient();

  return $JAWN_API.useMutation("post", "/v1/prompt-2025/update", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      queryClient.invalidateQueries({ queryKey: ["promptsWithVersions"] });
      queryClient.invalidateQueries({ queryKey: ["promptVersions"] });
      queryClient.invalidateQueries({ queryKey: ["promptVersionWithBody"] });
      queryClient.invalidateQueries({ queryKey: ["promptEnvironments"] });
    },
  });
};

export const useGetPromptEnvironments = () => {
  return useQuery<string[]>({
    queryKey: ["promptEnvironments"],
    queryFn: async () => {
      const result = await $JAWN_API.GET("/v1/prompt-2025/environments", {});
      if (result.error || !result.data?.data) {
        logger.error({ error: result.error }, "Error fetching prompt environments");
        return [];
      }
      return result.data.data;
    },
  });
};

export const useGetPromptTags = () => {
  return useQuery<string[]>({
    queryKey: ["promptTags"],
    queryFn: async () => {
      const result = await $JAWN_API.GET("/v1/prompt-2025/tags", {});
      if (result.error || !result.data?.data) {
        logger.error({ error: result.error }, "Error fetching prompt tags");
        return [];
      }
      return result.data.data;
    },
  });
};

export const useGetPromptInputs = (
  promptId: string,
  versionId: string,
  requestId: string,
) => {
  return useQuery<Prompt2025Input | null>({
    queryKey: ["promptInputs", promptId, versionId, requestId],
    refetchOnWindowFocus: false,
    enabled: !!promptId && !!versionId && !!requestId,
    queryFn: async () => {
      const result = await $JAWN_API.GET(
        "/v1/prompt-2025/id/{promptId}/{versionId}/inputs",
        {
          params: {
            path: {
              promptId: promptId,
              versionId: versionId,
            },
            query: {
              requestId: requestId,
            },
          },
        },
      );

      if (result.error || !result.data?.data) {
        logger.error({ error: result.error }, "Error fetching prompt inputs");
        return null;
      }

      return result.data.data;
    },
  });
};

export const useSetPromptVersionEnvironment = () => {
  const queryClient = useQueryClient();

  return $JAWN_API.useMutation(
    "post",
    "/v1/prompt-2025/update/environment",
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["prompts"] });
        queryClient.invalidateQueries({ queryKey: ["promptsWithVersions"] });
        queryClient.invalidateQueries({ queryKey: ["promptVersions"] });
        queryClient.invalidateQueries({ queryKey: ["promptVersionWithBody"] });
        queryClient.invalidateQueries({ queryKey: ["promptEnvironments"] });
      },
    },
  );
};

export const useDeletePrompt = () => {
  const queryClient = useQueryClient();

  return $JAWN_API.useMutation("delete", "/v1/prompt-2025/{promptId}", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      queryClient.invalidateQueries({ queryKey: ["promptsWithVersions"] });
      queryClient.invalidateQueries({ queryKey: ["promptTags"] });
      queryClient.invalidateQueries({ queryKey: ["promptVersions"] });
      queryClient.invalidateQueries({ queryKey: ["promptVersionWithBody"] });
    },
  });
};

export const useDeletePromptVersion = () => {
  const queryClient = useQueryClient();

  return $JAWN_API.useMutation(
    "delete",
    "/v1/prompt-2025/{promptId}/{versionId}",
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["prompts"] });
        queryClient.invalidateQueries({ queryKey: ["promptsWithVersions"] });
        queryClient.invalidateQueries({ queryKey: ["promptVersions"] });
        queryClient.invalidateQueries({ queryKey: ["promptVersionWithBody"] });
      },
    },
  );
};

export const useGetPromptVersion = (promptVersionId?: string, withBody: boolean = true) => {
  return useQuery<{
    promptVersion: Prompt2025Version;
    promptBody?: OpenAIChatRequest;
    prompt: Prompt2025;
  }>({
    queryKey: ["promptVersionWithBody", promptVersionId],
    refetchOnWindowFocus: false,
    enabled: !!promptVersionId,
    queryFn: async () => {
      const result = await $JAWN_API.POST("/v1/prompt-2025/query/version", {
        body: {
          promptVersionId: promptVersionId!,
        },
      });

      if (result.error || !result.data?.data) {
        logger.error({ error: result.error }, "Error fetching prompt version with body");
        return {
          promptVersion: {} as Prompt2025Version,
          promptBody: undefined,
          prompt: {} as Prompt2025,
        };
      }

      const promptResult = await $JAWN_API.GET(
        "/v1/prompt-2025/id/{promptId}",
        {
          params: {
            path: {
              promptId: result.data.data.prompt_id,
            },
          },
        },
      );

      if (promptResult.error || !promptResult.data?.data) {
        logger.error({ error: promptResult.error }, "Error fetching prompt");
        return {
          promptVersion: {} as Prompt2025Version,
          promptBody: undefined,
          prompt: {} as Prompt2025,
        };
      }

      const prompt = promptResult.data.data;
      const promptVersion = result.data.data;
      let promptBody: OpenAIChatRequest | undefined;

      if (promptVersion.s3_url && withBody) {
        try {
          const s3Response = await fetch(promptVersion.s3_url);
          if (s3Response.ok) {
            promptBody = (await s3Response.json()) as OpenAIChatRequest;
          } else {
            logger.error({ status: s3Response.status }, "Failed to fetch from S3 URL");
          }
        } catch (error) {
          logger.error({ error }, "Error fetching prompt body from S3");
        }
      }

      return {
        promptVersion,
        promptBody,
        prompt,
      };
    },
  });
};

export const useGetPromptVersions = (
  promptId: string,
  majorVersion?: number,
) => {
  return useQuery<Prompt2025Version[]>({
    queryKey: ["promptVersions", promptId, majorVersion],
    refetchOnWindowFocus: false,
    // ONLY RUN IF PROMPT ID AND MAJOR VERSION ARE DEFINED
    enabled: !!promptId && majorVersion !== undefined,
    queryFn: async () => {
      const versionsResult = await $JAWN_API.POST(
        "/v1/prompt-2025/query/versions",
        {
          body: {
            promptId: promptId,
            majorVersion: majorVersion,
          },
        },
      );

      if (versionsResult.error || !versionsResult.data?.data) {
        logger.error({ error: versionsResult.error }, "Error fetching prompt versions");
        return [];
      }

      return versionsResult.data.data;
    },
  });
};

export const useGetPromptsWithVersions = (
  search: string,
  tagsFilter: string[],
  page: number = 0,
  pageSize: number = 10,
) => {
  return useQuery<{
    prompts: PromptWithVersions[];
    totalCount: number;
  }>({
    queryKey: ["promptsWithVersions", { search, tagsFilter, page, pageSize }],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const promptsResult = await $JAWN_API.POST("/v1/prompt-2025/query", {
        body: {
          search: search,
          tagsFilter: tagsFilter,
          page: page,
          pageSize: pageSize,
        },
      });

      if (promptsResult.error || !promptsResult.data?.data) {
        logger.error({ error: promptsResult.error }, "Error fetching prompts");
        return {
          prompts: [],
          totalCount: 0,
        };
      }

      const prompts = promptsResult.data.data;

      const promptsWithVersions = await Promise.all(
        prompts.map(async (prompt): Promise<PromptWithVersions> => {
          const versionsResult = await $JAWN_API.POST(
            "/v1/prompt-2025/query/versions",
            {
              body: {
                promptId: prompt.id,
              },
            },
          );

          const totalVersionsResult = await $JAWN_API.POST(
            "/v1/prompt-2025/query/total-versions",
            {
              body: {
                promptId: prompt.id,
              },
            },
          );

          const productionVersionResult = await $JAWN_API.POST(
            "/v1/prompt-2025/query/production-version",
            {
              body: {
                promptId: prompt.id,
              },
            },
          );

          if (
            versionsResult.error ||
            !versionsResult.data?.data ||
            totalVersionsResult.error ||
            !totalVersionsResult.data?.data ||
            productionVersionResult.error ||
            !productionVersionResult.data?.data
          ) {
            logger.error({ promptId: prompt.id, error: versionsResult.error }, "Error fetching versions for prompt");
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
        }),
      );

      const totalPromptsResult = await $JAWN_API.GET(
        "/v1/prompt-2025/count",
        {},
      );
      if (totalPromptsResult.error || !totalPromptsResult.data?.data) {
        logger.error({ error: totalPromptsResult.error }, "Error fetching total prompts");
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
