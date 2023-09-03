// import { useQuery } from "@tanstack/react-query";
import { useQuery } from "@apollo/client";
import { gql } from "../../lib/api/graphql/client";
import { HeliconeRunFilter } from "../../lib/api/graphql/schema/types/graphql";
import { SortLeafRun } from "../lib/sorts/requests/sorts";

export const GET_TASKS = gql(/* GraphQL */ `
  query FetchTasks(
    $heliconeTaskId: String
    $limit: Int
    $offset: Int
    $runId: String
    $filters: [HeliconeTaskFilter!]
  ) {
    heliconeTask(
      id: $heliconeTaskId
      limit: $limit
      offset: $offset
      run_id: $runId
      filters: $filters
    ) {
      id
      name
      description
      created_at
      updated_at
      run_id
      parent_id
      properties {
        name
        value
      }
    }
  }
`);
