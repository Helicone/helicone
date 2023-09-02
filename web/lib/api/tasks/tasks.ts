import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildFilterWithAuth,
  buildFilterWithAuthClickHouse,
  buildFilterWithAuthRunsTable,
  buildFilterWithAuthTasksTable,
} from "../../../services/lib/filters/filters";
import {
  SortLeafRequest,
  SortLeafRun,
  buildRequestSort,
  buildRunSort,
} from "../../../services/lib/sorts/requests/sorts";
import { Json } from "../../../supabase/database.types";
import { Result, resultMap } from "../../result";
import { RunStatus } from "../../sql/runs";
import {
  dbExecute,
  dbQueryClickhouse,
  printRunnableQuery,
} from "../db/dbExecute";

export interface HeliconeTask {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  run_id: string;
  parent_id: string;
  properties: {
    [key: string]: string;
  };
}

export async function getTasks(
  orgId: string,
  filter: FilterNode,
  offset: number,
  limit: number
): Promise<Result<HeliconeTask[], string>> {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }
  const builtFilter = await buildFilterWithAuthTasksTable({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const query = `
  SELECT 
    task.id,
    task.name,
    task.description,
    task.created_at,
    task.updated_at,
    task.run as run_id,
    task.parent_task as parent_id,
    task.custom_properties as properties
  FROM task
  WHERE (
    ${builtFilter.filter}
  )
  ORDER BY created_at desc
  LIMIT ${limit}
  OFFSET ${offset}
`;
  // printRunnableQuery(query, builtFilter.argsAcc);

  return await dbExecute<HeliconeTask>(query, builtFilter.argsAcc);
}
