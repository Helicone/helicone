import { useQuery } from "@tanstack/react-query";
import { useOrg } from "../../../components/layout/organizationContext";
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

  return {
    isLoading,
    refetch,
    isRefetching,
    prompts: data?.data?.data,
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
