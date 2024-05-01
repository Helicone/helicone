import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildFilterWithAuth,
  buildFilterWithAuthCacheHits,
  buildFilterWithAuthClickHouse,
} from "../../../services/lib/filters/filters";
import {
  SortLeafRequest,
  buildRequestSort,
} from "../../../services/lib/sorts/requests/sorts";
import { Json } from "../../../supabase/database.types";
import { Result, resultMap, ok } from "../../result";
import { dbExecute, dbQueryClickhouse } from "../db/dbExecute";
import { LlmSchema } from "../models/requestResponseModel";
import { S3Client } from "../db/s3Client";
import { mapGeminiPro } from "../graphql/helpers/mappers";
import { ProviderName } from "../../../packages/cost/providers/mappings";

export type Provider = ProviderName | "CUSTOM";
const MAX_TOTAL_BODY_SIZE = 3 * 1024 * 1024;

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
    (response.prompt_tokens + response.completion_tokens) as total_tokens,
    response.completion_tokens as completion_tokens,
    response.prompt_tokens as prompt_tokens,
    job_node_request.node_id as node_id,
    feedback.created_at AS feedback_created_at,
    feedback.id AS feedback_id,
    feedback.rating AS feedback_rating,
    (
    SELECT ARRAY_AGG(asset.id)
    FROM asset
    WHERE asset.request_id = request.id
    ) AS asset_ids
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
  const requests = await dbExecute<HeliconeRequest>(query, builtFilter.argsAcc);
  const s3Client = new S3Client(
    process.env.S3_ACCESS_KEY ?? "",
    process.env.S3_SECRET_KEY ?? "",
    process.env.S3_ENDPOINT ?? "",
    process.env.S3_BUCKET_NAME ?? ""
  );
  const results = await mapLLMCalls(requests.data, s3Client, orgId);
  return resultMap(results, (data) => {
    return data;
  });
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
  const builtFilter = await buildFilterWithAuthCacheHits({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const sortSQL = buildRequestSort(sort);
  const query = `
  SELECT response.id AS response_id,
    cache_hits.created_at as response_created_at,
    CASE 
      WHEN LENGTH(response.body::text) > ${MAX_TOTAL_BODY_SIZE} THEN '{"helicone_message": "request body too large"}'::jsonb
      WHEN request.path LIKE '%embeddings%' THEN '{"helicone_message": "embeddings response omitted"}'::jsonb
      ELSE response.body::jsonb
    END AS response_body,
    response.status AS response_status,
    request.id AS request_id,
    cache_hits.created_at as request_created_at,
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
    (response.prompt_tokens + response.completion_tokens) as total_tokens,
    response.completion_tokens as completion_tokens,
    response.prompt_tokens as prompt_tokens,
    feedback.created_at AS feedback_created_at,
    feedback.id AS feedback_id,
    feedback.rating AS feedback_rating,
    (
    SELECT ARRAY_AGG(asset.id)
    FROM asset
    WHERE asset.request_id = request.id
    ) AS asset_ids
  FROM cache_hits
    inner join request on cache_hits.request_id = request.id
    inner join response on request.id = response.request
    left join feedback on response.id = feedback.response_id
  WHERE (
    (${builtFilter.filter})
    AND (LENGTH(response.body::text) + LENGTH(request.body::text)) <= ${MAX_TOTAL_BODY_SIZE}
  )
  ${sortSQL !== undefined ? `ORDER BY ${sortSQL}` : ""}
  LIMIT ${limit}
  OFFSET ${offset}
`;

  const requests = await dbExecute<HeliconeRequest>(query, builtFilter.argsAcc);
  const s3Client = new S3Client(
    process.env.S3_ACCESS_KEY ?? "",
    process.env.S3_SECRET_KEY ?? "",
    process.env.S3_ENDPOINT ?? "",
    process.env.S3_BUCKET_NAME ?? ""
  );
  const results = await mapLLMCalls(requests.data, s3Client, orgId);
  return resultMap(results, (data) => {
    return data;
  });
}

async function mapLLMCalls(
  heliconeRequests: HeliconeRequest[] | null,
  s3Client: S3Client,
  orgId: string
): Promise<Result<HeliconeRequest[], string>> {
  const promises =
    heliconeRequests?.map(async (heliconeRequest) => {
      // First retrieve s3 signed urls if past the implementation date
      const s3ImplementationDate = new Date("2024-03-30T02:00:00Z");
      const requestCreatedAt = new Date(heliconeRequest.request_created_at);
      if (
        (process.env.S3_ENABLED ?? "true") === "true" &&
        requestCreatedAt > s3ImplementationDate
      ) {
        const { data: signedBodyUrl, error: signedBodyUrlErr } =
          await s3Client.getRequestResponseBodySignedUrl(
            orgId,
            heliconeRequest.request_id
          );

        if (signedBodyUrlErr || !signedBodyUrl) {
          // If there was an error, just return the request as is
          return heliconeRequest;
        }

        heliconeRequest.signed_body_url = signedBodyUrl;

        const assetUrls: Record<string, string> = {};

        if (heliconeRequest.asset_ids) {
          try {
            const signedUrlPromises = heliconeRequest.asset_ids.map(
              async (assetId: string) => {
                const { data: signedImageUrl, error: signedImageUrlErr } =
                  await s3Client.getRequestResponseImageSignedUrl(
                    orgId,
                    heliconeRequest.request_id,
                    assetId
                  );

                return {
                  assetId,
                  signedImageUrl:
                    signedImageUrlErr || !signedImageUrl ? "" : signedImageUrl,
                };
              }
            );

            const signedUrls = await Promise.all(signedUrlPromises);

            signedUrls.forEach(({ assetId, signedImageUrl }) => {
              assetUrls[assetId] = signedImageUrl;
            });

            heliconeRequest.asset_urls = assetUrls;
          } catch (error) {
            console.error(`Error fetching asset: ${error}`);
            return heliconeRequest;
          }
        }
      }

      // Next map to standardized schema
      // Extract the model from various possible locations.
      const model =
        heliconeRequest.model_override ||
        heliconeRequest.response_model ||
        heliconeRequest.request_model ||
        heliconeRequest.response_body?.model ||
        heliconeRequest.request_body?.model ||
        heliconeRequest.response_body?.body?.model || // anthropic
        getModelFromPath(heliconeRequest.request_path) ||
        "";

      try {
        if (model === "gemini-pro" || model === "gemini-pro-vision") {
          const mappedSchema = mapGeminiPro(heliconeRequest, model);
          heliconeRequest.llmSchema = mappedSchema;
          return heliconeRequest;
        }
      } catch (error: any) {
        // Do nothing, FE will fall back to existing mappers
      }

      return heliconeRequest;
    }) ?? [];

  return ok<HeliconeRequest[], string>(await Promise.all(promises));
}

const getModelFromPath = (path: string) => {
  const regex1 = /\/engines\/([^/]+)/;
  const regex2 = /models\/([^/:]+)/;

  let match = path.match(regex1);

  if (!match) {
    match = path.match(regex2);
  }

  if (match && match[1]) {
    return match[1];
  } else {
    return undefined;
  }
};

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
      llmSchema: {
        request:
          JSON.stringify(d.llmSchema?.request ?? {}).length > maxBodySize / 2
            ? {
                model: d.llmSchema?.request.model,
                heliconeMessage: "Request schema too large",
                tooLarge: true,
              }
            : d.llmSchema?.request ?? {},
        response:
          JSON.stringify(d.llmSchema?.response ?? {}).length > maxBodySize / 2
            ? {
                model: d.llmSchema?.request?.model,
                heliconeMessage: "Response body too large",
                tooLarge: true,
              }
            : d.llmSchema?.response,
      },
    };
  });

  return trunced;
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
