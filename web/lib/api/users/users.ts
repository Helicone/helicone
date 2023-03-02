import { SupabaseClient } from "@supabase/auth-helpers-nextjs";

import { dbExecute } from "../db/dbExecute";
import { Result } from "../../result";
import { Database } from "../../../supabase/database.types";
import { buildFilter } from "../../../services/lib/filters/filters";
import { FilterNode } from "../../../services/lib/filters/filterDefs";

export interface UserMetric {
  user_id: string;
  active_for: number;
  first_active: Date;
  last_active: Date;
  total_requests: number;
  average_requests_per_day_active: number;
  average_tokens_per_request: number;
}

export async function userMetrics(
  user_id: string,
  filter: FilterNode,
  offset: number,
  limit: number
): Promise<Result<UserMetric[], string>> {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }
  const query = `
SELECT request.user_id,
  count(DISTINCT date_trunc('day'::text, request.created_at)) AS active_for,
  min(request.created_at) AS first_active,
  max(request.created_at) AS last_active,
  count(request.id) AS total_requests,
  count(request.id)::double precision / count(DISTINCT date_trunc('day'::text, request.created_at))::double precision AS average_requests_per_day_active,
  avg((((response.body ->> 'usage'::text)::json) ->> 'total_tokens'::text)::integer) AS average_tokens_per_request
 FROM request
  LEFT JOIN response ON response.request = request.id
  LEFT JOIN user_api_keys ON user_api_keys.api_key_hash = request.auth_hash
  WHERE (
    user_api_keys.user_id = '${user_id}'
    AND (${buildFilter(filter)})
  )
  GROUP BY request.user_id
  HAVING (
    true
    AND (${buildFilter(filter, true)})
  )
  ORDER BY last_active DESC
  LIMIT ${limit}
  OFFSET ${offset}
`;

  const { data, error } = await dbExecute<UserMetric>(query);
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}

export async function userMetricsCount(
  user_id: string,
  filter: FilterNode
): Promise<Result<number, string>> {
  const query = `
SELECT count(*) as count
  FROM (
    SELECT request.user_id,
      count(DISTINCT date_trunc('day'::text, request.created_at)) AS active_for,
      min(request.created_at) AS first_active,
      max(request.created_at) AS last_active,
      count(request.id) AS total_requests,
      count(request.id)::double precision / count(DISTINCT date_trunc('day'::text, request.created_at))::double precision AS average_requests_per_day_active,
      avg((((response.body ->> 'usage'::text)::json) ->> 'total_tokens'::text)::integer) AS average_tokens_per_request
    FROM request
      LEFT JOIN response ON response.request = request.id
      LEFT JOIN user_api_keys ON user_api_keys.api_key_hash = request.auth_hash
    WHERE (
      user_api_keys.user_id = '${user_id}'
      AND (${buildFilter(filter)})
    )
    GROUP BY request.user_id
    HAVING (
      true
      AND (${buildFilter(filter, true)})
    )
    ORDER BY last_active DESC
  ) as x
`;

  const { data, error } = await dbExecute<{ count: number }>(query);
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data[0].count, error: null };
}
