import { LLMRequestBody } from "@/packages/llm-mapper/types";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "../../../components/layout/org/organizationContext";
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

export const createPromptFromRequest = async (
  jawn: any,
  request: LLMRequestBody,
  router: any,
  setNotification: (message: string, type: "success" | "error") => void
) => {
  // Generate a unique name like "new prompt", "new prompt (1)", etc.
  const basePromptName = "new-prompt";
  const existingPrompts =
    (
      await jawn.POST("/v1/prompt/query", {
        body: {
          filter: "all",
        },
      })
    )?.data?.data || [];

  let promptName = basePromptName;
  let counter = 1;

  while (existingPrompts.some((p: any) => p.user_defined_id === promptName)) {
    promptName = `${basePromptName}-${counter}`;
    counter++;
  }

  const res = await jawn.POST("/v1/prompt/create", {
    body: {
      userDefinedId: promptName,
      prompt: request,
      metadata: {
        createdFromUi: true,
      },
    },
  });

  if (res.error || !res.data.data?.id) {
    setNotification("Error creating prompt", "error");
    return null;
  } else {
    setNotification("Prompt created successfully", "success");
    router.push(`/prompts/${res.data.data?.id}`);
    return res.data.data;
  }
};
