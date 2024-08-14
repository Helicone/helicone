import { FilterNode } from "../../shared/filters/filterDefs";
import {
  buildFilterWithAuth,
  buildFilterWithAuthCacheHits,
  buildFilterWithAuthClickHouse,
} from "../../shared/filters/filters";
import {
  SortLeafRequest,
  buildRequestSort,
  buildRequestSortV2,
} from "../../shared/sorts/requests/sorts";
import { Result, resultMap, ok, err } from "../../shared/result";
import {
  dbExecute,
  dbQueryClickhouse,
  printRunnableQuery,
} from "../../shared/db/dbExecute";
import { LlmSchema } from "../../shared/requestResponseModel";
import { mapGeminiPro } from "./mappers";
import { S3Client } from "../../shared/db/s3Client";

export type Provider =
  | "OPENAI"
  | "ANTHROPIC"
  | "TOGETHERAI"
  | "GROQ"
  | "GOOGLE"
  | "CUSTOM";
const MAX_TOTAL_BODY_SIZE = 1024 * 1024;

export interface HeliconeRequestAsset {
  assetUrl: string;
}

export interface Asset {
  id: string;
  request_id: string;
  organization_id: string;
  created_at: string;
}

export interface HeliconeRequest {
  /**
   * @example "Happy"
   */
  response_id: string | null;
  response_created_at: string | null;
  response_body?: any;
  response_status: number;
  response_model: string | null;
  request_id: string;
  request_created_at: string;
  request_body: any;
  request_path: string;
  request_user_id: string | null;
  request_properties: Record<string, string> | null;
  request_model: string | null;
  model_override: string | null;
  helicone_user: string | null;
  provider: Provider;
  delay_ms: number | null;
  time_to_first_token: number | null;
  total_tokens: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  prompt_id: string | null;
  feedback_created_at?: string | null;
  feedback_id?: string | null;
  feedback_rating?: boolean | null;
  signed_body_url?: string | null;
  llmSchema: LlmSchema | null;
  country_code: string | null;
  asset_ids: string[] | null;
  asset_urls: Record<string, string> | null;
  scores: Record<string, number> | null;
  costUSD?: number | null;
  properties: Record<string, string>;
  assets: Array<string>;
  target_url: string;
}

function addJoinQueries(joinQuery: string, filter: FilterNode): string {
  if (
    JSON.stringify(filter).includes("prompts_versions") ||
    JSON.stringify(filter).includes("prompt_input_record")
  ) {
    joinQuery = `left join prompt_input_record on request.id = prompt_input_record.source_request
    left join prompts_versions on prompts_versions.id = prompt_input_record.prompt_version`;
  }

  if (
    JSON.stringify(filter).includes("experiment_v2_hypothesis_run") ||
    JSON.stringify(filter).includes("score_value")
  ) {
    joinQuery += `
    left join experiment_v2_hypothesis_run ON request.id = experiment_v2_hypothesis_run.result_request_id
    left join score_value ON request.id = score_value.request_id`;
  }

  if (JSON.stringify(filter).includes("request_response_search")) {
    joinQuery += `
    left join request_response_search on request.id = request_response_search.request_id`;
  }
  return joinQuery;
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

  const joinQuery = addJoinQueries("", filter);
  if (offset > 10_000 || offset < 0) {
    return err("unsupport offset value");
  }

  if (limit < 0 || limit > 1_000) {
    return err("invalid limit");
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
    '{"helicone_message": "fetching body from signed_url... contact engineering@helicone.ai for more information"}'::jsonb AS response_body,
    response.status AS response_status,
    request.id AS request_id,
    request.created_at as request_created_at,
    '{"helicone_message": "fetching body from signed_url... contact engineering@helicone.ai for more information"}'::jsonb AS request_body,
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
      SELECT jsonb_object_agg(
        sa.score_key, 
        jsonb_build_object(
          'value', sv.int_value,
          'valueType', sa.value_type
        )
      )
      FROM score_value sv
      JOIN score_attribute sa ON sv.score_attribute = sa.id
      WHERE sv.request_id = request.id
    ) AS scores
  FROM request
    left join response on request.id = response.request
    left join feedback on response.id = feedback.response_id
    ${joinQuery}
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
    process.env.S3_ENDPOINT_PUBLIC ?? process.env.S3_ENDPOINT ?? "",
    process.env.S3_BUCKET_NAME ?? "",
    (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
  );
  const results = await mapLLMCalls(requests.data, s3Client, orgId);
  return resultMap(results, (data) => {
    return data;
  });
}

export async function getRequestsV2(
  orgId: string,
  filter: FilterNode,
  offset: number,
  limit: number,
  sort: SortLeafRequest
): Promise<Result<HeliconeRequest[], string>> {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }

  const sortSQL = buildRequestSortV2(sort);

  if (limit < 0 || limit > 1_000) {
    return err("invalid limit");
  }
  const builtFilter = await buildFilterWithAuthClickHouse({
    org_id: orgId,
    filter,
    argsAcc: [],
  });

  const query = `
    SELECT response_id,
      map('helicone_message', 'Response body no longer supported. To retrieve response body, please contact engineering@helicone.ai') as response_body,
      response_created_at,
      toInt32(status) AS response_status,
      request_id,
      map('helicone_message', 'Request body no longer supported. To retrieve request body, please contact engineering@helicone.ai') as request_body,
      request_created_at,
      user_id AS request_user_id,
      properties AS request_properties,
      provider,
      toInt32(latency) AS delay_ms,
      model AS request_model,
      time_to_first_token,
      (prompt_tokens + completion_tokens) AS total_tokens,
      completion_tokens,
      prompt_tokens,
      country_code,
      scores,
      properties,
      assets,
      target_url,
    FROM request_response_versioned FINAL
    WHERE (
      (${builtFilter.filter})
    )
    ${sortSQL !== undefined ? `ORDER BY ${sortSQL}` : ""}
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const requests = await dbQueryClickhouse<HeliconeRequest>(
    query,
    builtFilter.argsAcc
  );

  const s3Client = new S3Client(
    process.env.S3_ACCESS_KEY ?? "",
    process.env.S3_SECRET_KEY ?? "",
    process.env.S3_ENDPOINT_PUBLIC ?? process.env.S3_ENDPOINT ?? "",
    process.env.S3_BUCKET_NAME ?? "",
    (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
  );

  const mappedRequests = await mapLLMCalls(requests.data, s3Client, orgId);

  return mappedRequests;
}

export async function getRequestsCachedV2(
  orgId: string,
  filter: FilterNode,
  offset: number,
  limit: number,
  sort: SortLeafRequest,
  isPartOfExperiment?: boolean,
  isScored?: boolean
): Promise<Result<HeliconeRequest[], string>> {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }

  if (offset > 10_000 || offset < 0) {
    return err("unsupported offset value");
  }

  if (limit < 0 || limit > 1_000) {
    return err("invalid limit");
  }

  const builtFilter = await buildFilterWithAuthClickHouse({
    org_id: orgId,
    filter,
    argsAcc: [],
  });

  const sortSQL = buildRequestSortV2(sort);

  const query = `
  SELECT
    rrv.response_id,
    rrv.response_body,
    rrv.response_created_at,
    rrv.status AS response_status,
    rrv.request_id,
    rrv.request_body,
    rrv.request_created_at,
    rrv.user_id AS request_user_id,
    rrv.properties AS request_properties,
    rrv.provider,
    rrv.target_url,
    rrv.model AS request_model,
    rrv.time_to_first_token,
    rrv.prompt_tokens + rrv.completion_tokens AS total_tokens,
    rrv.completion_tokens,
    rrv.prompt_tokens,
    rrv.country_code,
    rrv.scores,
    rrv.properties,
    rrv.assets,
    ch.created_at AS cache_hit_created_at,
    ch.latency AS cache_hit_latency
  FROM request_response_versioned rrv
  INNER JOIN cache_hits ch ON rrv.request_id = ch.request_id
  WHERE rrv.organization_id = '${orgId}'
    AND (${builtFilter.filter})
  ${
    sortSQL !== undefined
      ? `ORDER BY ${sortSQL}`
      : "ORDER BY rrv.request_created_at DESC"
  }
  LIMIT ${limit}
  OFFSET ${offset}
  `;

  const requests = await dbQueryClickhouse<HeliconeRequest>(
    query,
    builtFilter.argsAcc
  );

  const s3Client = new S3Client(
    process.env.S3_ACCESS_KEY ?? "",
    process.env.S3_SECRET_KEY ?? "",
    process.env.S3_ENDPOINT_PUBLIC ?? process.env.S3_ENDPOINT ?? "",
    process.env.S3_BUCKET_NAME ?? "",
    (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
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
  sort: SortLeafRequest,
  isPartOfExperiment?: boolean,
  isScored?: boolean
): Promise<Result<HeliconeRequest[], string>> {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }

  if (offset > 10_000 || offset < 0) {
    return err("unsupport offset value");
  }

  if (limit < 0 || limit > 1_000) {
    return err("invalid limit");
  }

  const joinQuery = addJoinQueries("", filter);
  const builtFilter = await buildFilterWithAuthCacheHits({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const sortSQL = buildRequestSort(sort);
  const query = `
  SELECT response.id AS response_id,
    cache_hits.created_at as response_created_at,
    '{"helicone_message": "fetching body from signed_url... contact engineering@helicone.ai for more information"}'::jsonb AS response_body,
    response.status AS response_status,
    request.id AS request_id,
    request.created_at as request_created_at,
    '{"helicone_message": "fetching body from signed_url... contact engineering@helicone.ai for more information"}'::jsonb AS request_body,
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
  FROM cache_hits
    inner join request on cache_hits.request_id = request.id
    inner join response on request.id = response.request
    left join feedback on response.id = feedback.response_id
    ${joinQuery}
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
    process.env.S3_ENDPOINT_PUBLIC ?? process.env.S3_ENDPOINT ?? "",
    process.env.S3_BUCKET_NAME ?? "",
    (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
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

export async function getRequestAsset(
  assetId: string,
  requestId: string,
  organizationId: string
): Promise<Result<Asset, string>> {
  const query = `
    SELECT * FROM asset
    WHERE id = $1 AND request_id = $2 AND organization_id = $3`;
  const { data: requestAsset, error: requestAssetError } =
    await dbExecute<Asset>(query, [assetId, requestId, organizationId]);

  if (requestAssetError || !requestAsset || requestAsset.length === 0) {
    return err("Asset not found");
  }

  return ok(requestAsset[0]);
}
