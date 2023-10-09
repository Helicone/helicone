// import { useQuery } from "@tanstack/react-query";
import { gql } from "../../lib/api/graphql/client";

export const GET_NODES = gql(/* GraphQL */ `
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
