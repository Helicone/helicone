import { Result, err, ok, resultMap } from "../../../packages/common/result";
import {
  DEFAULT_UUID,
  HeliconeRequest,
} from "@helicone-package/llm-mapper/types";
import { dbExecute, dbQueryClickhouse } from "../../shared/db/dbExecute";
import { S3Client } from "../../shared/db/s3Client";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import {
  buildFilterWithAuth,
  buildFilterWithAuthClickHouse,
} from "@helicone-package/filters/filters";
import {
  SortLeafRequest,
  buildRequestSort,
  buildRequestSortClickhouse,
} from "../../shared/sorts/requests/sorts";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import { SortDirection } from "../../shared/sorts/requests/sorts";
import { safeJsonParse } from "../../../utils/helpers";

export interface HeliconeRequestAsset {
  assetUrl: string;
}

export interface Asset {
  id: string;
  request_id: string;
  organization_id: string;
  created_at: string;
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
    process.env.S3_ACCESS_KEY || undefined,
    process.env.S3_SECRET_KEY || undefined,
    process.env.S3_ENDPOINT_PUBLIC ?? process.env.S3_ENDPOINT ?? "",
    process.env.S3_BUCKET_NAME ?? "",
    (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
  );
  const results = await mapLLMCalls(requests.data, s3Client, orgId);
  return resultMap(results, (data) => {
    return data;
  });
}

export async function getRequestsClickhouseNoSort(
  orgId: string,
  filter: FilterNode,
  offset: number,
  limit: number,
  createdAtSort: SortDirection
): Promise<Result<HeliconeRequest[], string>> {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }

  if (limit < 0 || limit > 1_000) {
    return err("invalid limit");
  }
  const builtFilter = await buildFilterWithAuthClickHouse({
    org_id: orgId,
    filter,
    argsAcc: [],
  });

  const sortSQL = createdAtSort === "asc" ? "ASC" : "DESC";
  const query = `
    WITH top_requests AS (
      SELECT
          request_id,
          request_created_at
      FROM request_response_rmt
      WHERE (${builtFilter.filter})
        AND request_created_at <= now() + INTERVAL 5 MINUTE
      ORDER BY request_created_at ${sortSQL}
      LIMIT ${limit}
      OFFSET ${offset}
    )
    SELECT response_id,
      if(notEmpty(response_body), response_body, '{"helicone_message": "fetching body from signed_url... contact engineering@helicone.ai for more information"}') as response_body,
      response_created_at,
      toInt32(status) AS response_status,
      request_id,
      if(notEmpty(request_body), request_body, '{"helicone_message": "fetching body from signed_url... contact engineering@helicone.ai for more information"}') as request_body,
      request_created_at,
      user_id AS request_user_id,
      properties AS request_properties,
      provider,
      toInt32(latency) AS delay_ms,
      model AS request_model,
      ai_gateway_body_mapping,
      time_to_first_token,
      (prompt_tokens + completion_tokens + reasoning_tokens) AS total_tokens,
      completion_tokens,
      reasoning_tokens,
      prompt_cache_read_tokens,
      prompt_cache_write_tokens,
      prompt_tokens,
      country_code,
      scores,
      properties,
      assets as asset_ids,
      target_url,
      cache_reference_id,
      request_referrer,
      cache_enabled,
      cost / ${COST_PRECISION_MULTIPLIER} as cost,
      prompt_id,
      prompt_version,
      updated_at,
      storage_location
    FROM request_response_rmt
    WHERE (
      organization_id = {val_0 : String} AND
      request_created_at >= (SELECT min(request_created_at) - interval '5 minute' FROM top_requests)
      AND request_created_at <= (SELECT max(request_created_at) + interval '5 minute' FROM top_requests)
      AND request_id IN (SELECT request_id FROM top_requests)
    )
    ORDER BY organization_id ${sortSQL}, toStartOfHour(request_created_at) ${sortSQL}, request_created_at ${sortSQL}
  `;
  const requests = await dbQueryClickhouse<HeliconeRequest>(
    query,
    builtFilter.argsAcc
  );

  const s3Client = new S3Client(
    process.env.S3_ACCESS_KEY || undefined,
    process.env.S3_SECRET_KEY || undefined,
    process.env.S3_ENDPOINT_PUBLIC ?? process.env.S3_ENDPOINT ?? "",
    process.env.S3_BUCKET_NAME ?? "",
    (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
  );

  const mappedRequests = await mapLLMCalls(requests.data, s3Client, orgId);

  return mappedRequests;
}

export async function getRequestsClickhouse(
  orgId: string,
  filter: FilterNode,
  offset: number,
  limit: number,
  sort: SortLeafRequest
): Promise<Result<HeliconeRequest[], string>> {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }

  const sortSQL = buildRequestSortClickhouse(sort);

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
      if(notEmpty(response_body), response_body, '{"helicone_message": "fetching body from signed_url... contact engineering@helicone.ai for more information"}') as response_body,
      response_created_at,
      toInt32(status) AS response_status,
      request_id,
      if(notEmpty(request_body), request_body, '{"helicone_message": "fetching body from signed_url... contact engineering@helicone.ai for more information"}') as request_body,
      request_created_at,
      user_id AS request_user_id,
      properties AS request_properties,
      provider,
      toInt32(latency) AS delay_ms,
      model AS request_model,
      ai_gateway_body_mapping,
      time_to_first_token,
      (prompt_tokens + completion_tokens + reasoning_tokens) AS total_tokens,
      completion_tokens,
      reasoning_tokens,
      prompt_tokens,
      prompt_cache_read_tokens,
      prompt_cache_write_tokens,
      country_code,
      scores,
      properties,
      assets as asset_ids,
      target_url,
      cache_reference_id,
      request_referrer,
      cache_enabled,
      cost / ${COST_PRECISION_MULTIPLIER} as cost,
      prompt_id,
      prompt_version,
      updated_at,
      storage_location,
      size_bytes
    FROM request_response_rmt
    WHERE (
      (${builtFilter.filter})
      AND request_created_at <= now() + INTERVAL 5 MINUTE
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
    process.env.S3_ACCESS_KEY || undefined,
    process.env.S3_SECRET_KEY || undefined,
    process.env.S3_ENDPOINT_PUBLIC ?? process.env.S3_ENDPOINT ?? "",
    process.env.S3_BUCKET_NAME ?? "",
    (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
  );

  const mappedRequests = await mapLLMCalls(requests.data, s3Client, orgId);

  return mappedRequests;
}

async function mapLLMCalls(
  heliconeRequests: HeliconeRequest[] | null,
  s3Client: S3Client,
  orgId: string
): Promise<Result<HeliconeRequest[], string>> {
  const promises =
    heliconeRequests?.map(async (heliconeRequest) => {
      // Check storage location - if clickhouse, only parse JSON
      if (heliconeRequest.storage_location === "clickhouse") {
        // Parse JSON strings if they are strings
        if (typeof heliconeRequest.response_body === "string") {
          const parsed = safeJsonParse(heliconeRequest.response_body);
          if (parsed) {
            heliconeRequest.response_body = parsed;
          }
        }
        if (typeof heliconeRequest.request_body === "string") {
          const parsed = safeJsonParse(heliconeRequest.request_body);
          if (parsed) {
            heliconeRequest.request_body = parsed;
          }
        }
        return heliconeRequest;
      }

      // If free tier limit exceeded, bodies were not stored - return as is
      if (heliconeRequest.storage_location === "not_stored_exceeded_free") {
        return heliconeRequest;
      }

      const { data: signedBodyUrl, error: signedBodyUrlErr } =
        await s3Client.getRequestResponseBodySignedUrl(
          orgId,
          heliconeRequest.cache_reference_id === DEFAULT_UUID
            ? heliconeRequest.request_id
            : (heliconeRequest.cache_reference_id ?? heliconeRequest.request_id)
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
