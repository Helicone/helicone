// src/users/usersService.ts
import { KafkaMessage } from "kafkajs";
import { RequestQueryParams } from "../../controllers/public/requestController";
import { KafkaProducer } from "../../lib/clients/KafkaProducer";
import { FREQUENT_PRECENT_LOGGING } from "../../lib/db/DBQueryTimer";
import { AuthParams, supabaseServer } from "../../lib/db/supabase";
import { dbExecute } from "../../lib/shared/db/dbExecute";
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
} from "../../lib/stores/request/request";
import { costOfPrompt } from "../../packages/cost";
import { BaseManager } from "../BaseManager";
import { ScoreManager } from "../score/ScoreManager";
import { HeliconeFeedbackMessage } from "../../lib/handlers/HandlerContext";
import { FeedbackManager } from "../feedback/FeedbackManager";

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
    const kafkaProducer = new KafkaProducer();
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
    const feedbackMessage: HeliconeFeedbackMessage = {
      requestId: requestId,
      organizationId: this.authParams.organizationId,
      feedback: feedback,
      createdAt: new Date(),
    };
    if (!kafkaProducer.isKafkaEnabled()) {
      console.log("Kafka is not enabled. Using feedback manager");
      const feedbackManager = new FeedbackManager();
      return await feedbackManager.handleFeedback(
        {
          batchId: "",
          partition: 0,
          lastOffset: "",
          messageCount: 1,
        },
        [feedbackMessage]
      );
    }
    console.log("Sending feedback message to Kafka");

    const res = await kafkaProducer.sendFeedbackMessage(
      [feedbackMessage],
      "helicone-scores-prod"
    );

    if (res.error) {
      console.error();
      return err(res.error);
    }

    return ok(null);
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
