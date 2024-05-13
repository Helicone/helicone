// src/users/usersService.ts
import { RequestQueryParams } from "../../controllers/public/requestController";
import { FREQUENT_PERCENT_LOGGING } from "../../lib/db/DBQueryTimer";
import { AuthParams, supabaseServer } from "../../lib/db/supabase";
import { S3Client } from "../../lib/shared/db/s3Client";
import { Result, err, ok, resultMap } from "../../lib/shared/result";
import { VersionedRequestStore } from "../../lib/stores/request/VersionedRequestStore";
import {
  HeliconeRequest,
  HeliconeRequestAsset,
  getRequestAsset,
  getRequests,
  getRequestsCached,
} from "../../lib/stores/request/request";
import { costOfPrompt } from "../../packages/cost";
import { BaseManager } from "../BaseManager";

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
      process.env.S3_BUCKET_NAME ?? ""
    );
  }

  async addPropertyToRequest(
    requestTag: string,
    property: string,
    value: string
  ): Promise<Result<null, string>> {
    const res = await this.versionedRequestStore.addPropertyToRequest(
      requestTag,
      property,
      value
    );

    if (res.error) {
      return err(res.error);
    }

    return ok(null);
  }

  private async waitForRequestsAndResponses(
    requestTag: string,
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

    for (let i = 0; i < maxRetries; i++) {
      const query = `select r.id as requestId, re.id as responseId
      from request r
      inner join response re on re.request = r.id
      where (r.request_tag = '$1'
      OR r.id = '$1')
      AND r.helicone_org_id = '$3'
      LIMIT 1;`;

      const { data: reqResData, error: reqResError } =
        await this.queryTimer.dbExecuteWithTiming<{
          requestId: string;
          responseId: string;
        }>(query, [requestTag, organizationId], {
          queryName: "select_request_response_by_request_tag",
          percentLogging: FREQUENT_PERCENT_LOGGING,
        });

      // Return error immediately if there is an error fetching request
      if (reqResError || !reqResData) {
        console.error(`Error fetching request: ${reqResError}`);
        return err(reqResError ?? `Error fetching request: ${requestTag}`);
      }

      // If no request are found, wait and retry
      if (reqResData.length === 0) {
        console.log(`Request not found, retrying...: ${requestTag}`);
        await this.sleep(i);
        continue;
      }

      return ok(reqResData[0]);
    }

    return err(
      `Max retries exceeded retrieving request and response for requestTag: ${requestTag}`
    );
  }

  async sleep(retryIndex: number) {
    const sleepDuration = retryIndex === 0 ? 1000 : 5000;
    await new Promise((resolve) => setTimeout(resolve, sleepDuration));
  }

  async feedbackRequest(
    requestTag: string,
    feedback: boolean
  ): Promise<Result<null, string>> {
    const requestResponses = await this.waitForRequestsAndResponses(
      requestTag,
      this.authParams.organizationId
    );

    if (requestResponses.error || !requestResponses.data) {
      return err(
        `Error fetching request and response: ${requestResponses.error}`
      );
    }

    const feedbackResult = await this.queryTimer.withTiming(
      supabaseServer.client
        .from("feedback")
        .upsert(
          {
            response_id: requestResponses.data.responseId,
            rating: feedback,
            created_at: new Date().toISOString(),
          },
          { onConflict: "response_id" }
        )
        .select("*"),
      {
        queryName: "upsert_feedback_by_response_id",
        percentLogging: FREQUENT_PERCENT_LOGGING,
      }
    );

    if (feedbackResult.error) {
      console.error("Error upserting feedback:", feedbackResult.error);
      return err(feedbackResult.error.message);
    }

    return ok(null);
  }

  async getRequests(
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
    } = params;

    const requests = isCached
      ? await getRequestsCached(
          this.authParams.organizationId,
          filter,
          offset,
          limit,
          sort
        )
      : await getRequests(
          this.authParams.organizationId,
          filter,
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
}
