import { useJawnClient } from "@/lib/clients/jawnHook";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const usePromptInputs = (promptVersionId: string) => {
  const jawn = useJawnClient();

  const inputs = useQuery({
    queryKey: ["promptInputs", promptVersionId],
    queryFn: async () => {
      return await jawn.POST(
        "/v1/prompt/version/{promptVersionId}/inputs/query",
        {
          params: {
            path: {
              promptVersionId: promptVersionId ?? "unknown",
            },
          },
          body: {
            limit: 1,
          },
        }
      );
    },
  });

  const getRandomInput = useMutation({
    mutationFn: async () => {
      return await jawn.POST(
        "/v1/prompt/version/{promptVersionId}/inputs/query",
        {
          params: {
            path: {
              promptVersionId: promptVersionId ?? "unknown",
            },
          },
          body: {
            limit: 1,
            random: true,
          },
        }
      );
    },
  });

  const hasInputs = useMemo(() => {
    return (inputs.data?.data?.data?.length ?? 0) > 0;
  }, [inputs.data]);

  return {
    inputs,
    getRandomInput,
    hasInputs,
  };
};
