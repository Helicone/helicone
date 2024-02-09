import { useQuery } from "@tanstack/react-query";
import { SinglePrompt } from "../../../pages/api/prompt/[promptId]/version/[version]";

const usePrompt = ({
  version,
  promptId,
}: {
  version: string;
  promptId?: string;
}) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["prompts", version, promptId],
    queryFn: async (query) => {
      const version = query.queryKey[1];
      const promptId = query.queryKey[2];
      if (!version || !promptId) {
        return;
      }

      const heliconeTemplate = await fetch(
        `/api/prompt/${promptId}/version/${version}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      ).then((res) => res.json() as Promise<SinglePrompt>);

      return {
        heliconeTemplate,
      };
    },
    refetchOnWindowFocus: false,
  });

  return {
    isLoading,
    refetch,
    isRefetching,
    heliconeTemplate: data?.heliconeTemplate.heliconeTemplate,
    properties: data?.heliconeTemplate.propertyRow,
    columnNames: data?.heliconeTemplate.columnNames,
  };
};

export { usePrompt };
