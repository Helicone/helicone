// import { useQuery } from "@tanstack/react-query";
import { useQuery } from "@apollo/client";
import { gql } from "../../lib/api/graphql/client";
import { HeliconeJobFilter } from "../../lib/api/graphql/schema/types/graphql";
import { SortLeafJob } from "../lib/sorts/requests/sorts";

export const GET_TASKS = gql(/* GraphQL */ `
  query FetchTasks(
    $heliconeNodeId: String
    $limit: Int
    $offset: Int
    $jobId: String
    $filters: [HeliconeNodeFilter!]
  ) {
    heliconeNode(
      id: $heliconeNodeId
      limit: $limit
      offset: $offset
      job_id: $jobId
      filters: $filters
    ) {
      id
      name
      description
      created_at
      updated_at
      job_id
      parent_node_ids
      properties {
        name
        value
      }
    }
  }
`);
