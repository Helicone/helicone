// src/users/usersService.ts
import { RequestQueryParams } from "../../controllers/public/requestController";
import { FREQUENT_PRECENT_LOGGING } from "../../lib/db/DBQueryTimer";
import { AuthParams, supabaseServer } from "../../lib/db/supabase";
import { dbExecute, dbQueryClickhouse } from "../../lib/shared/db/dbExecute";
import { S3Client } from "../../lib/shared/db/s3Client";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { Result, err, ok, resultMap } from "../../lib/shared/result";
import { VersionedRequestStore } from "../../lib/stores/request/VersionedRequestStore";
import {
  HeliconeRequest,
  HeliconeRequestAsset,
  getRequestAsset,
  getRequests,
  getRequestsCached,
  getRequestsCachedClickhouse,
  getRequestsClickhouse,
} from "../../lib/stores/request/request";
import { costOfPrompt } from "../../packages/cost";
import { BaseManager } from "../BaseManager";
import { ScoreManager } from "../score/ScoreManager";
import { HeliconeScoresMessage } from "../../lib/handlers/HandlerContext";
import { cacheResultCustom } from "../../utils/cacheResult";
import { KVCache } from "../../lib/cache/kvCache";

const deltaTime = (date: Date, minutes: number) => {
  return new Date(date.getTime() - minutes * 60000);
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
      process.env.S3_ACCESS_KEY ?? "",
      process.env.S3_SECRET_KEY ?? "",
      process.env.S3_ENDPOINT ?? "",
      process.env.S3_BUCKET_NAME ?? "",
      (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
    );
  }

  async getRequestById(
    requestId: string
  ): Promise<Result<HeliconeRequest, string>> {
    return await cacheResultCustom(
      "v1/request/" + requestId + this.authParams.organizationId,
      () => this.uncachedGetRequestById(requestId),
      kvCache
    );
  }

  async getRequestByIds(
    requestIds: string[]
  ): Promise<Result<HeliconeRequest[], string>> {
    const requests = await Promise.all(
      requestIds.map((requestId) => this.getRequestById(requestId))
    );

    return ok(requests.map((r) => r.data).filter((r) => r !== null));
  }

  private async uncachedGetRequestById(
    requestId: string
  ): Promise<Result<HeliconeRequest, string>> {
    const requestPostgres = await this.getRequestsPostgres({
      filter: {
        request: {
          id: {
            equals: requestId,
          },
        },
      },
    });

    if (requestPostgres.error) {
      return err(requestPostgres.error);
    }

    const requestFromPostgres = requestPostgres.data?.[0];
    const requestClickhouse = await this.getRequestsClickhouse({
      filter: {
        left: {
          left: {
            request_response_rmt: {
              request_id: {
                equals: requestId,
              },
            },
          },
          operator: "and",
          right: {
            request_response_rmt: {
              model: {
                equals: requestFromPostgres?.request_model ?? "",
              },
            },
          },
        },
        right: {
          right: {
            request_response_rmt: {
              request_created_at: {
                gt: deltaTime(
                  new Date(requestFromPostgres?.request_created_at!),
                  -10
                ),
              },
            },
          },
          left: {
            request_response_rmt: {
              request_created_at: {
                lt: deltaTime(
                  new Date(requestFromPostgres?.request_created_at!),
                  10
                ),
              },
            },
          },
          operator: "and",
        },
        operator: "and",
      },
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
    const maxRetries = 3;

    let sleepDuration = 30_000; // 30 seconds
    for (let i = 0; i < maxRetries; i++) {
      const { data: response, error: responseError } = await dbExecute<{
        request: string;
        response: string;
      }>(
        `
        SELECT
          request.id as request,
          response.id as response
        FROM request inner join response on request.id = response.request
        WHERE request.helicone_org_id = $1
        AND request.id = $2
        `,
        [organizationId, heliconeId]
      );

      if (responseError) {
        console.error("Error fetching response:", responseError);
        return err(responseError);
      }

      if (response && response.length > 0) {
        return ok({
          requestId: response[0].request,
          responseId: response[0].response,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, sleepDuration));
      sleepDuration *= 2.5; // 30s, 75s, 187.5s
    }

    return { error: "Request not found.", data: null };
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

    const requests = isCached
      ? await getRequestsCached(
          this.authParams.organizationId,
          filter,
          offset,
          limit,
          sort,
          isPartOfExperiment,
          isScored
        )
      : await getRequests(
          this.authParams.organizationId,
          newFilter,
          offset,
          limit,
          sort
        );

    return resultMap(requests, (req) => {
      return req.map((r) => {
        return {
          ...r,
          costUSD: costOfPrompt({
            model:
              r.model_override ?? r.response_model ?? r.request_model ?? "",
            provider: r.provider ?? "",
            completionTokens: r.completion_tokens ?? 0,
            promptTokens: r.prompt_tokens ?? 0,
          }),
        };
      });
    });
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
      isCached,
      isPartOfExperiment,
      isScored,
    } = params;

    let newFilter = filter;

    if (isScored !== undefined) {
      newFilter = this.addScoreFilterClickhouse(isScored, newFilter);
    }

    const requests = isCached
      ? await getRequestsCachedClickhouse(
          this.authParams.organizationId,
          filter,
          offset,
          limit,
          sort,
          isPartOfExperiment,
          isScored
        )
      : await getRequestsClickhouse(
          this.authParams.organizationId,
          newFilter,
          offset,
          limit,
          sort
        );

    return resultMap(requests, (req) => {
      const seen = new Set();
      return req
        .map((r) => {
          return {
            ...r,
            request_created_at: toISOStringClickhousePatch(
              r.request_created_at
            ),
            feedback_created_at: r.feedback_created_at
              ? toISOStringClickhousePatch(r.feedback_created_at)
              : null,
            response_created_at: r.response_created_at
              ? toISOStringClickhousePatch(r.response_created_at)
              : null,
            costUSD: costOfPrompt({
              model: r.request_model ?? "",
              provider: r.provider ?? "",
              completionTokens: r.completion_tokens ?? 0,
              promptTokens: r.prompt_tokens ?? 0,
            }),
          };
        })
        .filter((r) => {
          if (seen.has(r.request_id)) {
            return false;
          }
          seen.add(r.request_id);
          return true;
        });
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
}
