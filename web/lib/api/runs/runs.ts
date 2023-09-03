import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildFilterWithAuth,
  buildFilterWithAuthClickHouse,
  buildFilterWithAuthRunsTable,
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

export interface HeliconeRun {
  id: string;
  status: RunStatus;
  name: string;
  description: string;
  task_count: number;
  request_count: number;
  created_at: string;
  updated_at: string;
  timeout_seconds: number;
  custom_properties: {
    [key: string]: string;
  };
}

export async function getRuns(
  orgId: string,
  filter: FilterNode,
  offset: number,
  limit: number,
  sort: SortLeafRun
): Promise<Result<HeliconeRun[], string>> {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }
  const builtFilter = await buildFilterWithAuthRunsTable({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const sortSQL = buildRunSort(sort);
  const query = `
  SELECT 
    run.id,
    run.status,
    run.name,
    run.description,
    run.created_at,
    run.updated_at,
    run.timeout_seconds,
    run.custom_properties,
    (
      SELECT count(*) 
      FROM task 
      WHERE task.run = run.id
    ) as task_count,
    (
      SELECT count(*) 
      FROM request 
      WHERE request.run_id = run.id
    ) as request_count
  FROM run
  WHERE (
    ${builtFilter.filter}
  )
  ${sortSQL !== undefined ? `ORDER BY ${sortSQL}` : ""}
  LIMIT ${limit}
  OFFSET ${offset}
`;

  return await dbExecute<HeliconeRun>(query, builtFilter.argsAcc);
}
