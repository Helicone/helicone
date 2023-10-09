import { useGetProperties } from "../../../services/hooks/properties";
import { useGetJobs } from "../../../services/hooks/jobs";

export const useJobPage = (
  currentPage: number,
  currentPageSize: number,
  isLive: boolean
) => {
  const { properties, isLoading: isPropertiesLoading } = useGetProperties();

  const { jobs: jobs } = useGetJobs({
    currentPage,
    currentPageSize,
    advancedFilter: [],
    sortLeaf: undefined,
    isLive,
  });

  return {
    jobs: jobs,
    count: 100,
    loading: jobs.loading || isPropertiesLoading,
    properties,
    refetch: jobs.refetch,
  };
};
