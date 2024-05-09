// src/users/usersService.ts
import { RequestQueryParams } from "../../controllers/public/requestController";
import { FREQUENT_PRECENT_LOGGING } from "../../lib/db/DBQueryTimer";
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
    requestId: string,
    property: string,
    value: string
  ): Promise<Result<null, string>> {
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
    userRequestId: string,
    organizationId: string
  ): Promise<
    Result<
      {
        requestIds: string[];
        responseIds: string[];
      },
      string
    >
  > {
    const maxRetries = 3;

    for (let i = 0; i < maxRetries; i++) {
      const { data: requests, error: requestsError } =
        await this.queryTimer.withTiming(
          supabaseServer.client
            .from("request")
            .select("*")
            .eq("user_request_id", userRequestId)
            .eq("helicone_org_id", organizationId),
          {
            queryName: "select_request_by_user_request_id",
            percentLogging: FREQUENT_PRECENT_LOGGING,
          }
        );

      if (requestsError || !requests || requests.length === 0) {
        console.error(
          "Error fetching request:",
          requestsError?.message ?? `Request not found: ${userRequestId}`
        );
        return err(
          requestsError?.message ?? `Request not found: ${userRequestId}`
        );
      }

      const { data: responses, error: responsesError } =
        await this.queryTimer.withTiming(
          supabaseServer.client
            .from("response")
            .select("*")
            .in("request_id", requests.map((r) => r.id) ?? []),
          {
            queryName: "select_response_by_request",
            percentLogging: FREQUENT_PRECENT_LOGGING,
          }
        );

      if (responsesError || !responses || responses.length === 0) {
        console.error(
          "Error fetching responses:",
          responsesError?.message ??
            `No responses found for request: ${userRequestId}`
        );
        return err(
          responsesError?.message ??
            `No responses found for request: ${userRequestId}`
        );
      }

      if (requests && requests.length > 0) {
        return ok({
          requestIds: requests.map((r) => r.id),
          responseIds: responses.map((r) => r.id),
        });
      }

      const sleepDuration = i === 0 ? 1000 : 5000;
      await new Promise((resolve) => setTimeout(resolve, sleepDuration));
    }

    return { error: "Request not found.", data: null };
  }
  async feedbackRequest(
    requestId: string,
    feedback: boolean
  ): Promise<Result<null, string>> {
    const requestResponses = await this.waitForRequestAndResponse(
      requestId,
      this.authParams.organizationId
    );

    if (
      requestResponses.error ||
      !requestResponses.data ||
      requestResponses.data.responseIds.length === 0
    ) {
      return err(
        `Error fetching request and response: ${requestResponses.error}`
      );
    }

    const responseIds = requestResponses.data.responseIds;
    const feedbackResult = await this.queryTimer.withTiming(
      supabaseServer.client
        .from("feedback")
        .upsert(
          responseIds.map((responseId) => ({
            response_id: responseId,
            rating: feedback,
            created_at: new Date().toISOString(),
          })),
          { onConflict: "response_id" }
        )
        .select("*"),
      {
        queryName: "upsert_feedback_by_response_ids",
        percentLogging: FREQUENT_PRECENT_LOGGING,
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
