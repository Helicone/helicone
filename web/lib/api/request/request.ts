import { SupabaseClient } from "@supabase/auth-helpers-nextjs";

import { dbExecute } from "../db/dbExecute";
import { Result } from "../../result";
import { Database, Json } from "../../../supabase/database.types";
import { buildFilter } from "../../../services/lib/filters/filters";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildRequestSort,
  SortLeafRequest,
} from "../../../services/lib/sorts/requests/sorts";

export interface HeliconeRequest {
  response_id: string;
  response_created_at: string;
  response_body: any;
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
  user_id: string,
  filter: FilterNode,
  offset: number,
  limit: number,
  sort: SortLeafRequest
): Promise<Result<HeliconeRequest[], string>> {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }
  const builtFilter = buildFilter(filter, []);
  const sortSQL = buildRequestSort(sort);
  const query = `
  SELECT response.id AS response_id,
    response.created_at as response_created_at,
    response.body AS response_body,
    request.id AS request_id,
    request.created_at as request_created_at,
    request.body AS request_body,
    request.path AS request_path,
    request.user_id AS request_user_id,
    request.properties AS request_properties,
    request.formatted_prompt_id as request_formatted_prompt_id,
    request.prompt_values as request_prompt_values,
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
  FROM response
    left join request on request.id = response.request
    left join user_api_keys on user_api_keys.api_key_hash = request.auth_hash
    left join prompt on request.formatted_prompt_id = prompt.id
  WHERE (
    user_api_keys.user_id = '${user_id}'
    AND (${builtFilter.filter})
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
  user_id: string,
  filter: FilterNode
): Promise<Result<number, string>> {
  const builtFilter = buildFilter(filter, []);
  const query = `
  SELECT count(*) as count
  FROM response
    left join request on request.id = response.request
    left join user_api_keys on user_api_keys.api_key_hash = request.auth_hash
    left join prompt on request.formatted_prompt_id = prompt.id
  WHERE (
    user_api_keys.user_id = '${user_id}'
    AND (${builtFilter.filter})
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
