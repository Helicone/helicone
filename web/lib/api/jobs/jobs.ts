import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuthJobsTable } from "../../../services/lib/filters/filters";
import {
  SortLeafJob,
  buildJobSort,
} from "../../../services/lib/sorts/requests/sorts";
import { Result } from "../../result";
import { JobStatus } from "../../sql/jobs";
import { dbExecute } from "../db/dbExecute";

export interface HeliconeJob {
  id: string;
  status: JobStatus;
  name: string;
  description: string;
  job_node_count: number;
  request_count: number;
  created_at: string;
  updated_at: string;
  timeout_seconds: number;
  custom_properties: {
    [key: string]: string;
  };
}

export async function getJobs(
  orgId: string,
  filter: FilterNode,
  offset: number,
  limit: number,
  sort: SortLeafJob
): Promise<Result<HeliconeJob[], string>> {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }
  const builtFilter = await buildFilterWithAuthJobsTable({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const sortSQL = buildJobSort(sort);
  const query = `
  SELECT 
    job.id,
    job.status,
    job.name,
    job.description,
    job.created_at,
    job.updated_at,
    job.timeout_seconds,
    job.custom_properties,
    (
      SELECT count(*) 
      FROM job_node 
      WHERE job_node.job = job.id
    ) as job_node_count,
    (
      SELECT count(*) 
      FROM job_node_request 
      WHERE job_node_request.job_id = job.id
    ) as request_count
  FROM job
  WHERE (
    ${builtFilter.filter}
  )
  ${sortSQL !== undefined ? `ORDER BY ${sortSQL}` : ""}
  LIMIT ${limit}
  OFFSET ${offset}
`;

  return await dbExecute<HeliconeJob>(query, builtFilter.argsAcc);
}
