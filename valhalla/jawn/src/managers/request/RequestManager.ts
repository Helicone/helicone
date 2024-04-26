// src/users/usersService.ts
import { RequestQueryParams } from "../../controllers/public/requestController";
import { FREQUENT_PRECENT_LOGGING } from "../../lib/db/DBQueryTimer";
import { AuthParams, supabaseServer } from "../../lib/db/supabase";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { S3Client } from "../../lib/shared/db/s3Client";
import { Result, err, ok } from "../../lib/shared/result";
import { VersionedRequestStore } from "../../lib/stores/request/VersionedRequestStore";
import {
  HeliconeRequest,
  HeliconeRequestAsset,
  getRequestAssetById,
  getRequests,
  getRequestsCached,
} from "../../lib/stores/request/request";
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

    for (let i = 0; i < maxRetries; i++) {
      const { data: request, error: requestError } =
        await this.queryTimer.withTiming(
          supabaseServer.client
            .from("request")
            .select("*")
            .eq("id", heliconeId)
            .eq("helicone_org_id", organizationId),
          {
            queryName: "select_request_by_id",
            percentLogging: FREQUENT_PRECENT_LOGGING,
          }
        );

      if (requestError) {
        console.error("Error fetching request:", requestError.message);
        return err(requestError.message);
      }

      const { data: response, error: responseError } =
        await this.queryTimer.withTiming(
          supabaseServer.client
            .from("response")
            .select("*")
            .eq("request", heliconeId),
          {
            queryName: "select_response_by_request",
            percentLogging: FREQUENT_PRECENT_LOGGING,
          }
        );

      if (responseError) {
        console.error("Error fetching response:", responseError.message);
        return err(responseError.message);
      }

      if (request && request.length > 0) {
        return ok({ requestId: request[0].id, responseId: response[0].id });
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
    const requestResponse = await this.waitForRequestAndResponse(
      requestId,
      this.authParams.organizationId
    );

    if (requestResponse.error || !requestResponse.data) {
      return err("Request not found");
    }

    const feedbackResult = await this.queryTimer.withTiming(
      supabaseServer.client
        .from("feedback")
        .upsert(
          {
            response_id: requestResponse.data.responseId,
            rating: feedback,
            created_at: new Date().toISOString(),
          },
          { onConflict: "response_id" }
        )
        .select("*")
        .single(),
      {
        queryName: "upsert_feedback_by_response_id",
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

    return isCached
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
  }

  async getRequestAssetById(
    requestId: string,
    assetId: string
  ): Promise<Result<HeliconeRequestAsset, string>> {
    const { data: assetData, error: assetError } = await getRequestAssetById(
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
