import { SupabaseClient } from "@supabase/auth-helpers-nextjs";

import { dbExecute } from "../db/dbExecute";
import { Result } from "../../result";
import { Database, Json } from "../../../supabase/database.types";
import { buildFilter } from "../../../services/lib/filters/filters";
import { FilterNode } from "../../../services/lib/filters/filterDefs";

export interface HeliconeRequest {
  response_id: string;
  response_created_at: string;
  response_body: any;
  request_id: string;
  request_created_at: string;
  request_body: any;
  request_path: string;
  request_user_id: string;
  request_properties: {
    [key: string]: Json;
  };
  request_formatted_prompt_id: string;
  request_prompt_values: {
    [key: string]: Json;
  };
  user_api_key_preview: string;
  user_api_key_user_id: string;
  user_api_key_hash: string;
  prompt_name: string;
  prompt_regex: string;
  is_cached: boolean;
}

export async function getRequests(
  user_id: string,
  filter: FilterNode,
  offset: number,
  limit: number
): Promise<Result<HeliconeRequest[], string>> {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }
  const query = `
  SELECT response.id AS response_id,
    coalesce(ch.created_at, response.created_at) as response_created_at,
    response.body AS response_body,
    request.id AS request_id,
    coalesce(ch.created_at, request.created_at) as request_created_at,
    request.body AS request_body,
    request.path AS request_path,
    request.user_id AS request_user_id,
    request.properties AS request_properties,
    request.formatted_prompt_id as request_formatted_prompt_id,
    request.prompt_values as request_prompt_values,
    user_api_keys.api_key_preview as user_api_key_preview,
    user_api_keys.user_id as user_api_key_user_id,
    user_api_keys.api_key_hash as user_api_key_hash,
    prompt.name AS prompt_name,
    prompt.prompt AS prompt_regex,
    ch.created_at IS NOT NULL AS is_cached
  FROM response
    left join request on request.id = response.request
    left join cache_hits ch on ch.request_id = request.id
    left join user_api_keys on user_api_keys.api_key_hash = request.auth_hash
    left join prompt on request.formatted_prompt_id = prompt.id
  WHERE (
    user_api_keys.user_id = '${user_id}'
    AND (${buildFilter(filter)})
  )
  ORDER BY response_created_at DESC
  LIMIT ${limit}
  OFFSET ${offset}
`;

  const { data, error } = await dbExecute<HeliconeRequest>(query);
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}

export async function getRequestCount(
  user_id: string,
  filter: FilterNode
): Promise<Result<number, string>> {
  const query = `
  SELECT count(*) as count
  FROM response
    left join request on request.id = response.request
    left join cache_hits ch on ch.request_id = request.id
    left join user_api_keys on user_api_keys.api_key_hash = request.auth_hash
    left join prompt on request.formatted_prompt_id = prompt.id
  WHERE (
    user_api_keys.user_id = '${user_id}'
    AND (${buildFilter(filter)})
  )
  `;

  const { data, error } = await dbExecute<{ count: number }>(query);
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data[0].count, error: null };
}
