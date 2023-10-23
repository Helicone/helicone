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
import { Result, resultMap } from "../../result";
import {
  dbExecute,
  dbQueryClickhouse,
  printRunnableQuery,
} from "../db/dbExecute";
export type Provider = "OPENAI" | "ANTHROPIC" | "CUSTOM";
const MAX_TOTAL_BODY_SIZE = 3900000 / 10;
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
  request_feedback: {
    [key: string]: Json;
  } | null;
  helicone_user: string | null;
  prompt_name: string | null;
  prompt_regex: string | null;
  key_name: string;
  request_prompt: string | null;
  response_prompt: string | null;
  delay_ms: number | null;
  total_tokens: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  provider: Provider;
  node_id: string | null;
  feedback_created_at?: string | null;
  feedback_id?: string | null;
  feedback_rating?: boolean | null;
}

export async function getRequestsCached(
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
    cache_hits.created_at as response_created_at,
    response.body AS response_body,
    response.status AS response_status,
    request.id AS request_id,
    cache_hits.created_at as request_created_at,
    request.body AS request_body,
    request.path AS request_path,
    request.user_id AS request_user_id,
    request.properties AS request_properties,
    request.formatted_prompt_id as request_formatted_prompt_id,
    request.prompt_values as request_prompt_values,
    request.provider as provider,
    response.feedback as request_feedback,
    request.helicone_user as helicone_user,
    response.delay_ms as delay_ms,
    (response.prompt_tokens + response.completion_tokens) as total_tokens,
    response.completion_tokens as completion_tokens,
    response.prompt_tokens as prompt_tokens,
    prompt.name AS prompt_name,
    prompt.prompt AS prompt_regex,
    feedback.created_at AS feedback_created_at,
    feedback.id AS feedback_id,
    feedback.rating AS feedback_rating,
    (coalesce(request.body ->>'prompt', request.body ->'messages'->0->>'content'))::text as request_prompt,
    (coalesce(response.body ->'choices'->0->>'text', response.body ->'choices'->0->>'message'))::text as response_prompt
  FROM cache_hits
    left join request on cache_hits.request_id = request.id
    left join response on request.id = response.request
    left join prompt on request.formatted_prompt_id = prompt.id
    left join feedback on response.id = feedback.response_id
  WHERE (
    (${builtFilter.filter})
    AND (LENGTH(response.body::text) + LENGTH(request.body::text)) <= ${MAX_TOTAL_BODY_SIZE}
  )
  ${sortSQL !== undefined ? `ORDER BY ${sortSQL}` : ""}
  LIMIT ${limit}
  OFFSET ${offset}
`;

  const res = await dbExecute<HeliconeRequest>(query, builtFilter.argsAcc);

  return resultMap(res, (data) => {
    return truncLargeData(data, MAX_TOTAL_BODY_SIZE);
  });
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

function truncLargeData(
  data: HeliconeRequest[],
  maxBodySize: number
): HeliconeRequest[] {
  const trunced = data.map((d) => {
    return {
      ...d,
      response_prompt:
        JSON.stringify(d.response_prompt).length > maxBodySize / 2
          ? "Response prompt too large"
          : d.response_prompt,
      request_prompt:
        JSON.stringify(d.request_prompt).length > maxBodySize / 2
          ? "Request prompt too large"
          : d.request_prompt,
      request_body:
        JSON.stringify(d.request_body).length > maxBodySize / 2
          ? {
              model: d.request_body.model,
              heliconeMessage: "Request body too large",
              tooLarge: true,
            }
          : d.request_body,
      response_body:
        JSON.stringify(d.response_body).length > maxBodySize / 2
          ? {
              heliconeMessage: "Response body too large",
              model: d.response_body.model,
              tooLarge: true,
            }
          : {
              ...d.response_body,
            },
    };
  });

  return trunced;
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
    request.provider as provider,
    response.feedback as request_feedback,
    request.helicone_user as helicone_user,
    response.delay_ms as delay_ms,
    (response.prompt_tokens + response.completion_tokens) as total_tokens,
    response.completion_tokens as completion_tokens,
    response.prompt_tokens as prompt_tokens,
    prompt.name AS prompt_name,
    prompt.prompt AS prompt_regex,
    job_node_request.node_id as node_id,
    feedback.created_at AS feedback_created_at,
    feedback.id AS feedback_id,
    feedback.rating AS feedback_rating,
    (coalesce(request.body ->>'prompt', request.body ->'messages'->0->>'content'))::text as request_prompt,
    (coalesce(response.body ->'choices'->0->>'text', response.body ->'choices'->0->>'message'))::text as response_prompt
  FROM request
    left join response on request.id = response.request
    left join prompt on request.formatted_prompt_id = prompt.id
    left join feedback on response.id = feedback.response_id
    left join job_node_request on request.id = job_node_request.request_id
  WHERE (
    (${builtFilter.filter})
  )
  ${sortSQL !== undefined ? `ORDER BY ${sortSQL}` : ""}
  LIMIT ${limit}
  OFFSET ${offset}
`;

  const res = await dbExecute<HeliconeRequest>(query, builtFilter.argsAcc);

  return resultMap(res, (data) => {
    return truncLargeData(data, MAX_TOTAL_BODY_SIZE);
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
from response_copy_v3 r
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
