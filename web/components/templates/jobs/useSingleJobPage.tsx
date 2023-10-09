import { useQuery } from "@apollo/client";
import { useGetProperties } from "../../../services/hooks/properties";
import { GET_JOBS as GET_JOBS } from "../../../services/hooks/jobs";
import { GET_NODES as GET_NODES } from "../../../services/hooks/tasks";

export const useSingleJobPage = (jobId: string, isLive: boolean) => {
  const { properties, isLoading: isPropertiesLoading } = useGetProperties();

  const job = useQuery(GET_JOBS, {
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
    nodes: nodes,
    job: job,
  };
};
