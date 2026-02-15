// src/users/usersService.ts
import { RequestQueryParams } from "../../controllers/public/requestController";
import { KVCache } from "../../lib/cache/kvCache";
import { HeliconeScoresMessage } from "../../lib/handlers/HandlerContext";
import { dbExecute, dbQueryClickhouse } from "../../lib/shared/db/dbExecute";
import { S3Client } from "../../lib/shared/db/s3Client";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { Result, err, ok, resultMap } from "../../packages/common/result";
import { VersionedRequestStore } from "../../lib/stores/request/VersionedRequestStore";
import {
  HeliconeRequestAsset,
  getRequestAsset,
  getRequests,
  getRequestsClickhouse,
  getRequestsClickhouseNoSort,
} from "../../lib/stores/request/request";
import { costOfPrompt } from "@helicone-package/cost";
import {
  HeliconeRequest,
  DEFAULT_UUID,
} from "@helicone-package/llm-mapper/types";
import { cacheResultCustom } from "../../utils/cacheResult";
import { BaseManager } from "../BaseManager";
import { ScoreManager } from "../score/ScoreManager";
import { AuthParams } from "../../packages/common/auth/types";
import { buildFilterWithAuthClickHouse } from "@helicone-package/filters/filters";
export const getModelFromPath = (path: string) => {
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

const deltaTime = (date: Date, minutes: number) => {
  return new Date(date.getTime() + minutes * 60000);
};

function toISOStringClickhousePatch(date: string): string {
  const dateObj = new Date(date);
  const tzOffset = dateObj.getTimezoneOffset() * 60000;

  const localDateObj = new Date(dateObj.getTime() - tzOffset);
  return localDateObj.toISOString();
}

const kvCache = new KVCache(24 * 60 * 60 * 1000 - 1000); // 1 day - 1 second

export class RequestManager extends BaseManager {
  private versionedRequestStore: VersionedRequestStore;
  private s3Client: S3Client;
  constructor(authParams: AuthParams) {
    super(authParams);

    this.versionedRequestStore = new VersionedRequestStore(
      authParams.organizationId
    );
    this.s3Client = new S3Client(
      process.env.S3_ACCESS_KEY || undefined,
      process.env.S3_SECRET_KEY || undefined,
      process.env.S3_ENDPOINT ?? "",
      process.env.S3_BUCKET_NAME ?? "",
      (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
    );
  }

  async getRequestById(
    requestId: string
  ): Promise<Result<HeliconeRequest, string>> {
    const result = await cacheResultCustom(
      "v1/request/" + requestId + this.authParams.organizationId,
      () => this.uncachedGetRequestById(requestId),
      kvCache
    );

    // Refresh S3 URLs even for cached data to ensure they're not expired
    if (result.data) {
      result.data = await this.refreshS3Urls(result.data);
    }

    return result;
  }

  /**
   * Refreshes S3 presigned URLs for a request to ensure they're not expired.
   * This generates new signed URLs for both the request/response body and any assets.
   */
  private async refreshS3Urls(
    heliconeRequest: HeliconeRequest
  ): Promise<HeliconeRequest> {
    const s3ImplementationDate = new Date("2024-03-30T02:00:00Z");
    const requestCreatedAt = new Date(heliconeRequest.request_created_at);

    // Only generate S3 URLs if S3 is enabled and request is after implementation date
    if (
      (process.env.S3_ENABLED ?? "true") === "true" &&
      requestCreatedAt > s3ImplementationDate
    ) {
      // Generate signed URL for request/response body
      const { data: signedBodyUrl, error: signedBodyUrlErr } =
        await this.s3Client.getRequestResponseBodySignedUrl(
          this.authParams.organizationId,
          heliconeRequest.cache_reference_id === DEFAULT_UUID
            ? heliconeRequest.request_id
            : (heliconeRequest.cache_reference_id ??
                heliconeRequest.request_id)
        );

      if (signedBodyUrlErr || !signedBodyUrl) {
        // If there was an error, just return the request as is
        return heliconeRequest;
      }

      heliconeRequest.signed_body_url = signedBodyUrl;

      // Generate signed URLs for all assets
      if (heliconeRequest.asset_ids) {
        const assetUrls: Record<string, string> = {};

        try {
          const signedUrlPromises = heliconeRequest.asset_ids.map(
            async (assetId: string) => {
              const { data: signedImageUrl, error: signedImageUrlErr } =
                await this.s3Client.getRequestResponseImageSignedUrl(
                  this.authParams.organizationId,
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
          console.error(`Error fetching asset URLs: ${error}`);
          return heliconeRequest;
        }
      }
    }

    return heliconeRequest;
  }

  // Never cache this unless you have a good reason
  async uncachedGetRequestByIdWithBody(
    requestId: string
  ): Promise<Result<HeliconeRequest, string>> {
    const request = await this.getRequestById(requestId);
    if (request.error || !request.data) {
      return err(request.error);
    }

    // Check if the body is already populated from ClickHouse (not the placeholder message)
    const hasRealBody =
      request.data.request_body &&
      typeof request.data.request_body === "object" &&
      !("helicone_message" in request.data.request_body);

    if (hasRealBody) {
      // Body already populated from ClickHouse, no need to fetch from S3
      return ok(request.data);
    }

    // Need to fetch from S3
    if (!request.data.signed_body_url) {
      return err("Request body not found");
    }
    try {
      const bodyResponse = await fetch(request.data.signed_body_url);
      if (!bodyResponse.ok) {
        console.error(
          `[RequestManager] Failed to fetch body: ${bodyResponse.status} ${bodyResponse.statusText}`
        );
        return err("Error fetching request body");
      }
      const bodyData = await bodyResponse.json();
      return ok({
        ...request.data,
        request_body: bodyData?.["request"],
        response_body: bodyData?.["response"],
      });
    } catch (e) {
      console.error("[RequestManager] Exception fetching body:", e);
      return err("Error fetching request body");
    }
  }

  async getRequestByIds(
    requestIds: string[]
  ): Promise<Result<HeliconeRequest[], string>> {
    const requests = await Promise.all(
      requestIds.map((requestId) => this.getRequestById(requestId))
    );

    return ok(requests.map((r) => r.data).filter((r) => r !== null) as HeliconeRequest[]);
  }

  private async uncachedGetRequestById(
    requestId: string
  ): Promise<Result<HeliconeRequest, string>> {
    const requestClickhouse = await this.getRequestsClickhouse({
      filter: {
        operator: "and",
        left: {
          request_response_rmt: {
            request_created_at: {
              gte: deltaTime(new Date(), -24 * 60 * 90), // last 90 days
            },
          },
        },
        right: {
          request_response_rmt: {
            request_id: {
              equals: requestId,
            },
          },
        },
      },
      limit: 1,
    });

    return resultMap(requestClickhouse, (data) => {
      return data?.[0];
    });
  }

  async addPropertyToRequest(
    requestId: string,
    property: string,
    value: string
  ): Promise<Result<null, string>> {
    const requestResponse = await this.waitForRequestAndResponse(
      requestId,
      this.authParams.organizationId
    );
    if (requestResponse.error) {
      return err("Request not found");
    }

    const res = await this.versionedRequestStore.addPropertyToRequest(
      requestId,
      property,
      value
    );

    if (res.error) {
      return err(res.error);
    }

    return ok(null);
  }

  // DEPRECATED: This method previously waited for request/response in legacy Postgres tables.
  // These tables no longer exist. All data is in ClickHouse now.
  private async waitForRequestAndResponse(
    heliconeId: string,
    organizationId: string
  ): Promise<
    Result<
      {
        requestId: string;
        responseId: string;
      },
      string
    >
  > {
    // Check ClickHouse instead of legacy Postgres tables
    const requestClickhouse = await this.getRequestsClickhouse({
      filter: {
        request_response_rmt: {
          request_id: {
            equals: heliconeId,
          },
        },
      },
      limit: 1,
    });

    if (requestClickhouse.error || !requestClickhouse.data?.[0]) {
      return err("Request not found in ClickHouse.");
    }

    return ok({
      requestId: requestClickhouse.data[0].request_id,
      responseId: requestClickhouse.data[0].response_id ?? "",
    });
  }
  async feedbackRequest(
    requestId: string,
    feedback: boolean
  ): Promise<Result<null, string>> {
    if (!this.isUUID(requestId)) {
      return err("Invalid requestId: must be a valid UUID");
    }
    const feedbackMessage: HeliconeScoresMessage = {
      requestId: requestId,
      organizationId: this.authParams.organizationId,
      scores: [
        {
          score_attribute_key: "helicone-score-feedback",
          score_attribute_type: "number",
          score_attribute_value: feedback ? 1 : 0,
        },
      ],
      createdAt: new Date(),
    };
    const scoreManager = new ScoreManager({
      organizationId: this.authParams.organizationId,
    });

    return await scoreManager.addBatchScores([feedbackMessage]);
  }

  private addScoreFilter(isScored: boolean, filter: FilterNode): FilterNode {
    if (isScored) {
      return {
        left: filter,
        operator: "and",
        right: {
          score_value: {
            request_id: {
              "not-equals": "null",
            },
          },
        },
      };
    } else {
      return {
        left: filter,
        operator: "and",
        right: {
          score_value: {
            request_id: {
              equals: "null",
            },
          },
        },
      };
    }
  }

  private addScoreFilterClickhouse(
    isScored: boolean,
    filter: FilterNode
  ): FilterNode {
    if (isScored) {
      return {
        left: filter,
        operator: "and",
        right: {
          request_response_rmt: {
            scores_column: {
              "not-equals": "{}",
            },
          },
        },
      };
    } else {
      return {
        left: filter,
        operator: "and",
        right: {
          request_response_rmt: {
            scores_column: {
              equals: "{}",
            },
          },
        },
      };
    }
  }

  private addPartOfExperimentFilter(
    isPartOfExperiment: boolean,
    filter: FilterNode
  ): FilterNode {
    if (isPartOfExperiment) {
      return {
        left: filter,
        operator: "and",
        right: {
          experiment_hypothesis_run: {
            result_request_id: {
              "not-equals": "null",
            },
          },
        },
      };
    } else {
      return {
        left: filter,
        operator: "and",
        right: {
          experiment_hypothesis_run: {
            result_request_id: {
              equals: "null",
            },
          },
        },
      };
    }
  }

  async getRequestsPostgres(
    params: RequestQueryParams
  ): Promise<Result<HeliconeRequest[], string>> {
    const {
      filter,
      offset = 0,
      limit = 10,
      sort = {
        created_at: "desc",
      },
      isCached,
      isPartOfExperiment,
      isScored,
    } = params;

    let newFilter = filter;

    if (isScored !== undefined) {
      newFilter = this.addScoreFilter(isScored, newFilter);
    }

    if (isPartOfExperiment !== undefined) {
      newFilter = this.addPartOfExperimentFilter(isPartOfExperiment, newFilter);
    }

    const requests = await getRequests(
      this.authParams.organizationId,
      newFilter,
      offset,
      limit,
      sort
    );

    return resultMap(requests, (req) => {
      return req.map((r) => {
        const model =
          r.model_override ?? r.response_model ?? r.request_model ?? "";
        return {
          ...r,
          model: model,
          costUSD: costOfPrompt({
            model: model,
            provider: r.provider ?? "",
            completionTokens: r.completion_tokens ?? 0,
            promptTokens: r.prompt_tokens ?? 0,
            promptCacheWriteTokens: r.prompt_cache_write_tokens ?? 0,
            promptCacheReadTokens: r.prompt_cache_read_tokens ?? 0,
            promptAudioTokens: r.prompt_audio_tokens ?? 0,
            completionAudioTokens: r.completion_audio_tokens ?? 0,
          }),
        };
      });
    });
  }

  async getRequestCount(params: {
    filter: FilterNode;
  }): Promise<Result<number, string>> {
    const { filter } = params;
    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: this.authParams.organizationId,
      filter,
      argsAcc: [],
    });

    const query = `
    SELECT COUNT(*) FROM request_response_rmt
    WHERE (${builtFilter.filter})
    `;

    const { data, error } = await dbQueryClickhouse<{ count: number }>(
      query,
      builtFilter.argsAcc
    );

    if (error) {
      return err(error);
    }

    return ok(data?.[0].count ?? 0);
  }

  async getRequestsClickhouse(
    params: RequestQueryParams
  ): Promise<Result<HeliconeRequest[], string>> {
    const {
      filter,
      offset = 0,
      limit = 10,
      sort = {
        created_at: "desc",
      },
      isScored,
    } = params;

    let newFilter = filter;

    if (isScored !== undefined) {
      newFilter = this.addScoreFilterClickhouse(isScored, newFilter);
    }

    const requests =
      sort.created_at === "desc" || sort.created_at === "asc"
        ? await getRequestsClickhouseNoSort(
            this.authParams.organizationId,
            newFilter,
            offset,
            limit,
            sort.created_at
          )
        : await getRequestsClickhouse(
            this.authParams.organizationId,
            newFilter,
            offset,
            limit,
            sort
          );

    return resultMap(requests, (req) => {
      const reqs = req.map((r) => {
        return {
          ...r,
          updated_at: r.updated_at
            ? toISOStringClickhousePatch(r.updated_at)
            : new Date().toISOString(),
          request_created_at: toISOStringClickhousePatch(r.request_created_at),
          feedback_created_at: r.feedback_created_at
            ? toISOStringClickhousePatch(r.feedback_created_at)
            : null,
          response_created_at: r.response_created_at
            ? toISOStringClickhousePatch(r.response_created_at)
            : null,
          model:
            r.model_override ??
            r.request_model ??
            r.response_model ??
            getModelFromPath(r.target_url) ??
            "unknown",
        };
      });
      const seen = new Map<string, HeliconeRequest>();

      for (const r of reqs) {
        const existing = seen.get(r.request_id);
        if (!existing) {
          seen.set(r.request_id, r);
          continue;
        }
        if (
          existing.updated_at &&
          r.updated_at &&
          r.updated_at > existing.updated_at
        ) {
          seen.set(r.request_id, r);
        }
      }

      let deduped = Array.from(seen.values());

      // Only re-sort by created_at if that was the requested sort
      // Otherwise, preserve the order returned from the database (e.g., latency sort)
      if (sort.created_at) {
        deduped.sort((a, b) => {
          const aTime = new Date(a.request_created_at).getTime();
          const bTime = new Date(b.request_created_at).getTime();
          return sort.created_at === "asc" ? aTime - bTime : bTime - aTime;
        });
      }

      return deduped;
    });
  }

  async getRequestAssetById(
    requestId: string,
    assetId: string
  ): Promise<Result<HeliconeRequestAsset, string>> {
    const { data: assetData, error: assetError } = await getRequestAsset(
      assetId,
      requestId,
      this.authParams.organizationId
    );

    if (assetError || !assetData) {
      return err(`${assetError}`);
    }
    const assetUrl = await this.s3Client.getRequestResponseImageSignedUrl(
      this.authParams.organizationId,
      requestId,
      assetData.id
    );
    if (assetUrl.error || !assetUrl.data) {
      return err(`Error getting asset: ${assetUrl.error}`);
    }
    return ok({
      assetUrl: assetUrl.data,
    });
  }

  private isUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  async getRequestInputs(
    requestId: string
  ): Promise<
    Result<
      {
        inputs: Record<string, any>;
        prompt_id: string;
        version_id: string;
        environment: string | null;
      } | null,
      string
    >
  > {
    const result = await dbExecute<{
      inputs: Record<string, any>;
      prompt_id: string;
      version_id: string;
      environment: string | null;
    }>(
      `SELECT
        pi.inputs,
        pv.prompt_id,
        pi.version_id,
        pi.environment
      FROM prompts_2025_inputs pi
      JOIN prompts_2025_versions pv ON pv.id = pi.version_id
      WHERE pi.request_id = $1
        AND pv.organization = $2
      LIMIT 1`,
      [requestId, this.authParams.organizationId]
    );

    if (result.error) {
      return err(result.error);
    }

    return ok(result.data?.[0] ?? null);
  }
}
