import { ProviderName } from "@helicone-package/cost/providers/mappings";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import {
  buildFilterWithAuth,
  buildFilterWithAuthClickHouse,
} from "@helicone-package/filters/filters";
import { HeliconeRequest } from "@helicone-package/llm-mapper/types";
import {
  SortLeafRequest,
  buildRequestSort,
} from "../../../services/lib/sorts/requests/sorts";
import { Result, resultMap } from "@/packages/common/result";
import { dbExecute, dbQueryClickhouse } from "../db/dbExecute";

export type Provider = ProviderName | "CUSTOM";
const MAX_TOTAL_BODY_SIZE = 3 * 1024 * 1024;

export async function getRequests(
  orgId: string,
  filter: FilterNode,
  offset: number,
  limit: number,
  sort: SortLeafRequest,
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
    CASE 
      WHEN LENGTH(response.body::text) > ${MAX_TOTAL_BODY_SIZE} THEN '{"helicone_message": "request body too large"}'::jsonb
      WHEN request.path LIKE '%embeddings%' THEN '{"helicone_message": "embeddings response omitted"}'::jsonb
      ELSE response.body::jsonb
    END AS response_body,
    response.status AS response_status,
    request.id AS request_id,
    request.created_at as request_created_at,
    CASE 
      WHEN LENGTH(request.body::text) > ${MAX_TOTAL_BODY_SIZE}
      THEN '{"helicone_message": "request body too large"}'::jsonb
      ELSE request.body::jsonb
    END AS request_body,
    request.country_code as country_code,
    request.path AS request_path,
    request.user_id AS request_user_id,
    request.properties AS request_properties,
    request.provider as provider,
    request.model as request_model,
    request.model_override as model_override,
    response.model as response_model,
    response.feedback as request_feedback,
    request.helicone_user as helicone_user,
    response.delay_ms as delay_ms,
    response.time_to_first_token as time_to_first_token,
    (response.prompt_tokens + response.completion_tokens + COALESCE(response.prompt_cache_read_tokens, 0) + COALESCE(response.prompt_cache_write_tokens, 0)) as total_tokens,
    response.completion_tokens as completion_tokens,
    response.prompt_tokens as prompt_tokens,
    job_node_request.node_id as node_id,
    request.prompt_id as prompt_id,
    feedback.created_at AS feedback_created_at,
    feedback.id AS feedback_id,
    feedback.rating AS feedback_rating,
    (
    SELECT ARRAY_AGG(asset.id)
    FROM asset
    WHERE asset.request_id = request.id
    ) AS asset_ids,
    (
      SELECT jsonb_object_agg(sa.score_key, sv.int_value)
      FROM score_value sv
      JOIN score_attribute sa ON sv.score_attribute = sa.id
      WHERE sv.request_id = request.id
    ) AS scores
  FROM request
    left join response on request.id = response.request
    left join feedback on response.id = feedback.response_id
    left join job_node_request on request.id = job_node_request.request_id
  WHERE (
    (${builtFilter.filter})
  )
  ${sortSQL !== undefined ? `ORDER BY ${sortSQL}` : ""}
  LIMIT ${limit}
  OFFSET ${offset}
`;
  return await dbExecute<HeliconeRequest>(query, builtFilter.argsAcc);
}

export async function getRequestsDateRange(
  orgId: string,
  filter: FilterNode,
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
    builtFilter.argsAcc,
  );

  return resultMap(res, (data) => {
    return {
      min: new Date(data[0].min),
      max: new Date(data[0].max),
    };
  });
}

export async function getRequestCount(
  org_id: string,
  filter: FilterNode,
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
    left join feedback on response.id = feedback.response_id
    left join job_node_request on request.id = job_node_request.request_id
  WHERE (
    (${builtFilter.filter})
  )
  `;
  const { data, error } = await dbExecute<{ count: number }>(
    query,
    builtFilter.argsAcc,
  );
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: +data[0].count, error: null };
}

export async function getRequestCountClickhouse(
  org_id: string,
  filter: FilterNode,
  isCached = false,
): Promise<Result<number, string>> {
  const builtFilter = await buildFilterWithAuthClickHouse({
    org_id,
    argsAcc: [],
    filter,
  });

  const query = `
SELECT
  count(DISTINCT request_response_rmt.request_id) as count
from request_response_rmt
WHERE (${builtFilter.filter})
${isCached ? "AND cache_enabled = 1" : ""}
`;
  const { data, error } = await dbQueryClickhouse<{ count: number }>(
    query,
    builtFilter.argsAcc,
  );
  if (error !== null) {
    return { data: null, error: error };
  }

  return { data: data[0].count, error: null };
}
