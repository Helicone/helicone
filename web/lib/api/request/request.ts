import { ProviderName } from "../../../packages/cost/providers/mappings";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildFilterWithAuth,
  buildFilterWithAuthClickHouse,
} from "../../../services/lib/filters/filters";
import { Json } from "../../../supabase/database.types";
import { Result, resultMap } from "../../result";
import { dbExecute, dbQueryClickhouse } from "../db/dbExecute";
import { LlmSchema } from "../models/requestResponseModel";

export type Provider = ProviderName | "CUSTOM";

export interface HeliconeRequest {
  response_id: string;
  response_created_at: string;
  response_body?: any;
  response_status: number;
  response_model: string | null;
  request_id: string;
  request_model: string | null;
  model_override: string | null;
  request_created_at: string;
  request_body: any;
  request_path: string;
  request_user_id: string | null;
  request_properties: {
    [key: string]: Json;
  } | null;
  request_feedback: {
    [key: string]: Json;
  } | null;
  helicone_user: string | null;
  prompt_name: string | null;
  prompt_regex: string | null;
  key_name: string;
  delay_ms: number | null;
  time_to_first_token: number | null;
  total_tokens: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  provider: Provider;
  node_id: string | null;
  feedback_created_at?: string | null;
  feedback_id?: string | null;
  feedback_rating?: boolean | null;
  signed_body_url?: string | null;
  llmSchema: LlmSchema | null;
  country_code: string | null;
  asset_ids: string[] | null;
  asset_urls: Record<string, string> | null;
}

export async function getRequestsDateRange(
  orgId: string,
  filter: FilterNode
): Promise<Result<{ min: Date; max: Date }, string>> {
  const builtFilter = await buildFilterWithAuth({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const query = `
  SELECT min(request.created_at) as min, max(request.created_at) as max
  FROM request
  WHERE (
    (${builtFilter.filter})
  )
`;

  const res = await dbExecute<{ min: Date; max: Date }>(
    query,
    builtFilter.argsAcc
  );

  return resultMap(res, (data) => {
    return {
      min: new Date(data[0].min),
      max: new Date(data[0].max),
    };
  });
}

export async function getRequestCountCached(
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
  FROM cache_hits
    left join request on cache_hits.request_id = request.id
    left join response on request.id = response.request
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
    left join prompt on request.formatted_prompt_id = prompt.id
    left join feedback on response.id = feedback.response_id
    left join job_node_request on request.id = job_node_request.request_id
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
from request_response_versioned r
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
