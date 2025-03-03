import { LLMRequestBody } from "@/packages/llm-mapper/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useOrg } from "../../../components/layout/org/organizationContext";
import useNotification from "../../../components/shared/notification/useNotification";
import { JawnFilterNode, getJawnClient } from "../../../lib/clients/jawn";
import { Result, resultMap } from "../../../lib/result";
import { RequestsOverTime } from "../../../lib/timeCalculations/fetchTimeData";
import {
  BackendMetricsCall,
  useBackendMetricCall,
} from "../useBackendFunction";

export const usePromptVersions = (promptId: string) => {
  const org = useOrg();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["prompts", org?.currentOrg?.id, promptId],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const promptId = query.queryKey[2] as string;

      const jawn = getJawnClient(orgId);
      return jawn.POST("/v1/prompt/{promptId}/versions/query", {
        params: {
          path: {
            promptId: promptId,
          },
        },
        body: {
          includeExperimentVersions: false,
        },
      });
    },
    enabled: !!promptId && !!org?.currentOrg?.id,
    refetchOnWindowFocus: false,
  });

  const sortedVersions = data?.data?.data
    ? [...data.data.data]
        .sort((a, b) => {
          if (b.major_version !== a.major_version) {
            return b.major_version - a.major_version;
          }
          return b.minor_version - a.minor_version;
        })
        .filter((v) => v.minor_version === 0)
    : undefined;

  return {
    isLoading,
    refetch,
    isRefetching,
    prompts: sortedVersions,
  };
};

export const usePrompts = (promptId?: string) => {
  const org = useOrg();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["prompts", org?.currentOrg?.id, promptId],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const promptId = query.queryKey[2] as string;
      const jawn = getJawnClient(orgId);

      let filterNode: JawnFilterNode = "all";

      if (promptId) {
        filterNode = {
          prompt_v2: {
            id: {
              equals: promptId,
            },
          },
        };
      }

      return jawn.POST("/v1/prompt/query", {
        body: {
          filter: filterNode,
        },
      });
    },
    refetchOnWindowFocus: false,
  });

  return {
    isLoading,
    refetch,
    isRefetching,
    prompts: data?.data?.data,
  };
};

export const usePrompt = (id: string) => {
  const org = useOrg();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["prompt", org?.currentOrg?.id, id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const id = query.queryKey[2] as string;
      const jawn = getJawnClient(orgId);

      return jawn.POST("/v1/prompt/{promptId}/query", {
        params: {
          path: {
            promptId: id,
          },
        },
        body: {
          // TODO: make sure we put the right time here
          timeFilter: {
            start: "2021-01-01",
            end: "2021-12-31",
          },
        },
      });
    },
    enabled: !!id && !!org?.currentOrg?.id,
    refetchOnWindowFocus: false,
  });

  return {
    isLoading,
    refetch,
    isRefetching,
    prompt: data?.data?.data,
  };
};

export const usePromptRequestsOverTime = (
  params: BackendMetricsCall<any>["params"],
  queryKey: string
) => {
  const promptUsageOverTime = useBackendMetricCall<
    Result<RequestsOverTime[], string>
  >({
    params,
    endpoint: "/api/metrics/requestOverTime",
    key: queryKey,
    postProcess: (data) => {
      return resultMap(data, (d) =>
        d.map((d) => ({ count: +d.count, time: new Date(d.time) }))
      );
    },
  });

  const totalRequests = promptUsageOverTime.data?.data?.reduce(
    (acc, curr) => acc + curr.count,
    0
  );

  return {
    data: promptUsageOverTime.data,
    isLoading: promptUsageOverTime.isLoading,
    refetch: promptUsageOverTime.refetch,
    total: totalRequests,
  };
};

export const useCreatePrompt = () => {
  const org = useOrg();
  const { setNotification } = useNotification();
  const jawn = getJawnClient(org?.currentOrg?.id);

  const mutation = useMutation({
    mutationFn: async ({
      prompt: prompt,
      metadata = {
        provider: "OPENAI",
        createdFromUi: true,
      },
    }: {
      prompt: Partial<LLMRequestBody>;
      metadata?: Record<string, any>;
    }) => {
      // Generate a unique name like "new prompt", "new prompt (1)", etc.
      const existingPrompts =
        (
          await jawn.POST("/v1/prompt/query", {
            body: {
              filter: "all",
            },
          })
        )?.data?.data || [];
      let promptName = "new-prompt";
      let counter = 1;
      while (
        existingPrompts.some((p: any) => p.user_defined_id === promptName)
      ) {
        promptName = `new-prompt-${counter}`;
        counter++;
      }

      const res = await jawn.POST("/v1/prompt/create", {
        body: {
          userDefinedId: promptName,
          prompt: prompt,
          metadata: metadata,
        },
      });

      if (res.error || !res.data.data?.id) {
        throw new Error("Error creating prompt");
      }

      return res.data.data;
    },
    onSuccess: () => {
      setNotification("Prompt created successfully", "success");
    },
    onError: () => {
      setNotification("Error creating prompt", "error");
    },
  });

  return {
    createPrompt: (
      request: Partial<LLMRequestBody>,
      metadata?: Record<string, any>
    ) => mutation.mutateAsync({ prompt: request, metadata }),
    isCreating: mutation.isLoading,
    error: mutation.error,
  };
};
