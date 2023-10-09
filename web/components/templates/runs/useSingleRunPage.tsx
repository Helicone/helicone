import { useQuery } from "@apollo/client";
import { useGetProperties } from "../../../services/hooks/properties";
import { GET_RUNS } from "../../../services/hooks/runs";
import { GET_TASKS as GET_NODES } from "../../../services/hooks/tasks";

export const useSingleRunPage = (jobId: string, isLive: boolean) => {
  const { properties, isLoading: isPropertiesLoading } = useGetProperties();

  const run = useQuery(GET_RUNS, {
    variables: {
      limit: 1,
      offset: 0,
      filters: [
        {
          id: {
            equals: jobId,
          },
        },
      ],
    },
    pollInterval: isLive ? 2_000 : undefined,
  });

  const nodes = useQuery(GET_NODES, {
    variables: {
      limit: 100,
      offset: 0,
      filters: [],
      jobId: jobId,
    },
    pollInterval: isLive ? 2_000 : undefined,
  });

  return {
    tasks: nodes,
    run,
  };
};
