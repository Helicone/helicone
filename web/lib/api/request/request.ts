import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildFilterWithAuth,
  buildFilterWithAuthClickHouse,
} from "../../../services/lib/filters/filters";
import {
  SortLeafRequest,
  buildRequestSort,
} from "../../../services/lib/sorts/requests/sorts";
import { Json } from "../../../supabase/database.types";
import { Result } from "../../result";
import { dbExecute, dbQueryClickhouse } from "../db/dbExecute";

export interface HeliconeRequest {
  response_id: string;
  response_created_at: string;
  response_body?: any;
  response_status: number;
  request_id: string;
  request_created_at: string;
  request_body: any;
  request_path: string;
  request_user_id: string | null;
  request_properties: {
    [key: string]: Json;
  } | null;
  request_formatted_prompt_id: string | null;
  request_prompt_values: {
    [key: string]: Json;
  } | null;
  helicone_user: string | null;
  user_api_key_preview: string;
  user_api_key_user_id: string;
  user_api_key_hash: string;
  prompt_name: string | null;
  prompt_regex: string | null;
  key_name: string;
  cache_count: number;
  request_prompt: string | null;
  response_prompt: string | null;
  delay_ms: number | null;
}

export async function getRequests(
  orgId: string,
  filter: FilterNode,
  offset: number,
  limit: number,
  sort: SortLeafRequest
): Promise<Result<HeliconeRequest[], string>> {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }
  const builtFilter = await buildFilterWithAuth({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const sortSQL = buildRequestSort(sort);
  const query = `
  SELECT response.id AS response_id,
    response.created_at as response_created_at,
    response.body AS response_body,
    response.status AS response_status,
    request.id AS request_id,
    request.created_at as request_created_at,
    request.body AS request_body,
    request.path AS request_path,
    request.user_id AS request_user_id,
    request.properties AS request_properties,
    request.formatted_prompt_id as request_formatted_prompt_id,
    request.prompt_values as request_prompt_values,
    request.helicone_user as helicone_user,
    response.delay_ms as delay_ms,
    user_api_keys.api_key_preview as user_api_key_preview,
    user_api_keys.user_id as user_api_key_user_id,
    user_api_keys.api_key_hash as user_api_key_hash,
    user_api_keys.key_name as key_name,
    prompt.name AS prompt_name,
    prompt.prompt AS prompt_regex,
    (select count(*) from cache_hits ch where ch.request_id = request.id) as cache_count,
    (coalesce(request.body ->>'prompt', request.body ->'messages'->0->>'content'))::text as request_prompt,
    (coalesce(response.body ->'choices'->0->>'text', response.body ->'choices'->0->>'message'))::text as response_prompt
  FROM request
    left join response on request.id = response.request
    left join user_api_keys on user_api_keys.api_key_hash = request.auth_hash
    left join prompt on request.formatted_prompt_id = prompt.id
  WHERE (
    (${builtFilter.filter})
  )
  ${sortSQL !== undefined ? `ORDER BY ${sortSQL}` : ""}
  LIMIT ${limit}
  OFFSET ${offset}
`;

  const { data, error } = await dbExecute<HeliconeRequest>(
    query,
    builtFilter.argsAcc
  );

  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}

export async function getRequestCount(
  org_id: string,
  filter: FilterNode
): Promise<Result<number, string>> {
  const builtFilter = await buildFilterWithAuth({
    org_id,
    argsAcc: [],
    filter,
  });

  const query = `
  SELECT count(request.id)::bigint as count
  FROM request
    left join response on request.id = response.request
    left join user_api_keys on user_api_keys.api_key_hash = request.auth_hash
    left join prompt on request.formatted_prompt_id = prompt.id
  WHERE (
    (${builtFilter.filter})
  )
  `;
  const { data, error } = await dbExecute<{ count: number }>(
    query,
    builtFilter.argsAcc
  );
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: +data[0].count, error: null };
}

export async function getRequestCountClickhouse(
  org_id: string,
  filter: FilterNode
): Promise<Result<number, string>> {
  const builtFilter = await buildFilterWithAuthClickHouse({
    org_id,
    argsAcc: [],
    filter,
  });

  const query = `
SELECT
  count(DISTINCT r.request_id) as count
from response_copy_v2 r
WHERE (${builtFilter.filter})
  `;
  const { data, error } = await dbQueryClickhouse<{ count: number }>(
    query,
    builtFilter.argsAcc
  );
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data[0].count, error: null };
}
