import { useQuery } from "@tanstack/react-query";

import { useJawnClient } from "../../../lib/clients/jawnHook";
import { JawnFilterNode } from "../../../lib/clients/jawn";
import {
  BackendMetricsCall,
  useBackendMetricCall,
} from "../useBackendFunction";
import { Result, resultMap } from "../../../lib/result";
import { RequestsOverTime } from "../../../lib/timeCalculations/fetchTimeData";

export const usePromptVersions = (promptId: string) => {
  const jawn = useJawnClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["prompts", jawn, promptId],
    queryFn: async (query) => {
      const jawn = query.queryKey[1] as ReturnType<typeof useJawnClient>;
      const promptId = query.queryKey[2] as string;

      return jawn.POST("/v1/prompt/{promptId}/versions/query", {
        params: {
          path: {
            promptId: promptId,
          },
        },
        body: {},
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
  const jawn = useJawnClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["prompts", jawn, promptId],
    queryFn: async (query) => {
      const jawn = query.queryKey[1] as ReturnType<typeof useJawnClient>;
      const promptId = query.queryKey[2] as string;

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
  const jawn = useJawnClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["prompt", jawn, id],
    queryFn: async (query) => {
      const jawn = query.queryKey[1] as ReturnType<typeof useJawnClient>; // code smelly
      const id = query.queryKey[2] as string;

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
