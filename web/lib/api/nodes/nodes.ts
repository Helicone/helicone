import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuthNodesTable } from "../../../services/lib/filters/filters";
import { Result } from "../../result";
import { dbExecute } from "../db/dbExecute";

export interface HeliconeNode {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  job_id: string;
  parent_node_ids?: string[];
  properties: {
    [key: string]: string;
  };
}

export async function getNodes(
  orgId: string,
  filter: FilterNode,
  offset: number,
  limit: number
): Promise<Result<HeliconeNode[], string>> {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }
  const builtFilter = await buildFilterWithAuthNodesTable({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const query = `
  SELECT 
    job_node.id,
    job_node.name,
    job_node.description,
    job_node.created_at,
    job_node.updated_at,
    job_node.job as job_id,
    (
      SELECT array_agg(job_node_relationships.parent_node_id)
      FROM job_node_relationships
      WHERE job_node_relationships.node_id = job_node.id
    ) as parent_node_ids,
    job_node.custom_properties as properties
  FROM job_node
  WHERE (
    ${builtFilter.filter}
  )
  ORDER BY created_at desc
  LIMIT ${limit}
  OFFSET ${offset}
`;
  // printRunnableQuery(query, builtFilter.argsAcc);

  return await dbExecute<HeliconeNode>(query, builtFilter.argsAcc);
}
