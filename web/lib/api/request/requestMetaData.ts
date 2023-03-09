import { SupabaseClient } from "@supabase/auth-helpers-nextjs";

import { dbExecute } from "../db/dbExecute";
import { Result } from "../../result";
import { Database, Json } from "../../../supabase/database.types";
import { buildFilter } from "../../../services/lib/filters/filters";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { buildSort, SortLeafRequest } from "../../../services/lib/sorts/sorts";

const MAX_REQUEST_ID_LIMIT = 100 * 100;
export interface RequestMetaData {
  cache_hit_count: number;
  request_id: string;
}

export async function getRequestsMetaData(
  user_id: string,
  requestIds: string[]
): Promise<Result<RequestMetaData[], string>> {
  // ensure requestIds are valid and are valid UUIDs
  for (const requestId of requestIds) {
    if (
      !requestId.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      )
    ) {
      return { data: null, error: "Invalid request id" };
    }
  }
  if (requestIds.length === 0) {
    return { data: null, error: "No request ids provided" };
  }
  if (requestIds.length > MAX_REQUEST_ID_LIMIT) {
    return {
      data: null,
      error: `Too many request ids provided. Max: ${MAX_REQUEST_ID_LIMIT}`,
    };
  }
  const query = `
  SELECT count(cache_hits.request_id) as cache_hit_count,
    request.id AS request_id
  FROM request 
    left join cache_hits on request.id = cache_hits.request_id
    left join user_api_keys on user_api_keys.api_key_hash = request.auth_hash
  WHERE (
    user_api_keys.user_id = '${user_id}'
    AND (${
      requestIds.length > 0
        ? `request.id IN ('${requestIds.join("','")}')`
        : "TRUE"
    })
  )
  GROUP BY request.id
`;

  const { data, error } = await dbExecute<RequestMetaData>(query);
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}
