import { useQuery } from "@apollo/client";
import { gql } from "../../lib/api/graphql/client";
import { HeliconeJobFilter } from "../../lib/api/graphql/schema/types/graphql";
import { SortLeafJob } from "../lib/sorts/requests/sorts";

export const GET_JOBS = gql(/* GraphQL */ `
  query FetchRuns($limit: Int, $offset: Int, $filters: [HeliconeJobFilter!]) {
    heliconeJob(filters: $filters, offset: $offset, limit: $limit) {
      id
      name
      description
      status
      created_at
      updated_at
      timeout_seconds
      node_count
      request_count
      properties {
        value
        name
      }
    }
  }
`);

/**
 * Custom hook to fetch jobs based on provided parameters.
 *
 * @param props - The hook parameters.
 * @param props.currentPage - The current page number.
 * @param props.currentPageSize - The number of jobs to fetch per page.
 * @param props.advancedFilter - The advanced filters to apply.
 * @param props.sortLeaf - The sort leaf for job sorting (optional).
 * @param props.isLive - Flag indicating whether to enable live updates.
 * @returns An object containing the fetched jobs.
 */
export const useGetJobs = (props: {
  currentPage: number;
  currentPageSize: number;
  advancedFilter: HeliconeJobFilter[];
  sortLeaf?: SortLeafJob;
  isLive: boolean;
}) => {
  const { currentPage, currentPageSize, advancedFilter, sortLeaf, isLive } =
    props;
  if (sortLeaf) {
    throw new Error("sortLeaf not implemented");
  }
  return {
    jobs: useQuery(GET_JOBS, {
      variables: {
        limit: currentPageSize,
        offset: (currentPage - 1) * currentPageSize,
        filters: advancedFilter,
      },
      pollInterval: isLive ? 2_000 : undefined,
    }),
  };
};
