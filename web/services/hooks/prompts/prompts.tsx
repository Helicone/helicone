import { useQuery } from "@tanstack/react-query";

import { useJawnClient } from "../../../lib/clients/jawnHook";

export const usePrompts = () => {
  const jawn = useJawnClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["prompts", jawn],
    queryFn: async (query) => {
      const jawn = query.queryKey[1] as ReturnType<typeof useJawnClient>;

      return jawn.POST("/v1/prompt/query", {
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

export const usePrompt = (id: string) => {
  const jawn = useJawnClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["prompts", jawn, id],
    queryFn: async (query) => {
      const jawn = query.queryKey[1] as ReturnType<typeof useJawnClient>;
      const id = query.queryKey[2] as string;

      return jawn.POST("/v1/prompt/{promptId}/query", {
        params: {
          path: {
            promptId: id,
          },
        },
        body: {
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
