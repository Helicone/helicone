// src/users/usersController.ts
import {
  Body,
  Controller,
  Example,
  Get,
  Path,
  Post,
  Put,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { FilterLeafSubset } from "@helicone-package/filters/filterDefs";
import { err, ok, Result } from "../../packages/common/result";
import { SortLeafRequest } from "../../lib/shared/sorts/requests/sorts";
import { HeliconeRequestAsset } from "../../lib/stores/request/request";
import { RequestManager } from "../../managers/request/RequestManager";
import { ScoreManager } from "../../managers/score/ScoreManager";
import type { ScoreRequest } from "../../managers/score/ScoreManager";
import { HeliconeRequest } from "@helicone-package/llm-mapper/types";
import type { JawnAuthenticatedRequest } from "../../types/request";
import { azurePattern } from "@helicone-package/cost/providers/mappings";

export type RequestClickhouseFilterBranch = {
  left: RequestClickhouseFilterNode;
  operator: "or" | "and";
  right: RequestClickhouseFilterNode;
};

export type RequestClickhouseFilterNode =
  | FilterLeafSubset<"request_response_rmt">
  | RequestClickhouseFilterBranch
  | "all";

export type RequestFilterBranch = {
  left: RequestFilterNode;
  operator: "or" | "and";
  right: RequestFilterNode;
};

export type RequestFilterNode =
  | FilterLeafSubset<
      | "feedback"
      | "request"
      | "response"
      | "properties"
      | "values"
      | "request_response_rmt"
      | "sessions_request_response_rmt"
    >
  | RequestFilterBranch
  | "all";

export interface RequestQueryParams {
  filter: RequestFilterNode;
  offset?: number;
  limit?: number;
  sort?: SortLeafRequest;
  isCached?: boolean;
  includeInputs?: boolean;
  isPartOfExperiment?: boolean;
  isScored?: boolean;
}

@Route("v1/request")
@Tags("Request")
@Security("api_key")
export class RequestController extends Controller {
  @Post("count/query")
  public async getRequestCount(
    @Body() requestBody: RequestQueryParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<number, string>> {
    const reqManager = new RequestManager(request.authParams);
    const count = await reqManager.getRequestCount(requestBody);
    if (count.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return count;
  }

  @Post("query")
  @Example<RequestQueryParams>({
    filter: {},
    isCached: false,
    limit: 10,
    offset: 0,
    sort: {
      created_at: "desc",
    },
    isScored: false,
    isPartOfExperiment: false,
  })
  public async getRequests(
    @Body()
    requestBody: RequestQueryParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<HeliconeRequest[], string>> {
    const reqManager = new RequestManager(request.authParams);
    const requests = await reqManager.getRequestsPostgres(requestBody);
    if (requests.error || !requests.data) {
      this.setStatus(500);
    } else {
      this.setStatus(201);
    }
    return requests;
  }

  @Post("query-clickhouse")
  @Example<RequestQueryParams>({
    filter: {},
    isCached: false,
    limit: 10,
    offset: 0,
    sort: {
      created_at: "desc",
    },
    isScored: false,
    isPartOfExperiment: false,
  })
  public async getRequestsClickhouse(
    @Body()
    requestBody: RequestQueryParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<HeliconeRequest[], string>> {
    // TODO we need to traverse and make point queries faster
    // TODO Basically we need to traverse and replace any filter RequestId: equals x, with all the PKs that are in the request_response_rmt, that we get from postgres
    const reqManager = new RequestManager(request.authParams);
    const requests = await reqManager.getRequestsClickhouse(requestBody);
    if (requests.error || !requests.data) {
      this.setStatus(500);
    } else {
      this.setStatus(201);
    }

    // TODO This is a hack for backwards compatibility on previous requests tagged as OPENAI coming from Azure OpenAI.
    // TODO Move this to a separate function, since it is not specific to clickhouse
    function patchAzureProvider(requests: Result<HeliconeRequest[], string>) {
      if (requests.data && Array.isArray(requests.data)) {
        for (const request of requests.data) {
          const targetUrl = request?.["target_url"];
          if (typeof targetUrl === "string" && azurePattern.test(targetUrl)) {
            request["provider"] = "AZURE";
          }
        }
      }
    }

    patchAzureProvider(requests);

    return requests;
  }

  @Get("/{requestId}")
  public async getRequestById(
    @Request() request: JawnAuthenticatedRequest,
    @Path() requestId: string,
    @Query() includeBody: boolean = false
  ): Promise<Result<HeliconeRequest, string>> {
    const reqManager = new RequestManager(request.authParams);
    let returnRequest: Result<HeliconeRequest, string>;
    if (includeBody) {
      returnRequest =
        await reqManager.uncachedGetRequestByIdWithBody(requestId);
    } else {
      returnRequest = await reqManager.getRequestById(requestId);
    }

    if (returnRequest.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return returnRequest;
  }

  @Post("/query-ids")
  public async getRequestsByIds(
    @Body() requestBody: { requestIds: string[] },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<HeliconeRequest[], string>> {
    const reqManager = new RequestManager(request.authParams);
    return reqManager.getRequestByIds(requestBody.requestIds);
  }

  @Post("/{requestId}/feedback")
  public async feedbackRequest(
    @Body()
    requestBody: { rating: boolean },
    @Request() request: JawnAuthenticatedRequest,
    @Path() requestId: string
  ): Promise<Result<null, string>> {
    const reqManager = new RequestManager(request.authParams);

    const requestFeedback = await reqManager.feedbackRequest(
      requestId,
      requestBody.rating
    );
    if (requestFeedback.error) {
      this.setStatus(500);
    } else {
      this.setStatus(201);
    }
    return requestFeedback;
  }

  @Put("/{requestId}/property")
  public async putProperty(
    @Body()
    requestBody: { key: string; value: string },
    @Request() request: JawnAuthenticatedRequest,
    @Path() requestId: string
  ): Promise<Result<null, string>> {
    const reqManager = new RequestManager(request.authParams);

    const requestFeedback = await reqManager.addPropertyToRequest(
      requestId,
      requestBody.key,
      requestBody.value
    );
    if (requestFeedback.error) {
      console.log(requestFeedback.error);
      this.setStatus(500);
    } else {
      this.setStatus(201);
    }
    return requestFeedback;
  }

  @Post("/{requestId}/assets/{assetId}")
  public async getRequestAssetById(
    @Request() request: JawnAuthenticatedRequest,
    @Path() requestId: string,
    @Path() assetId: string
  ): Promise<Result<HeliconeRequestAsset, string>> {
    const reqManager = new RequestManager(request.authParams);

    const requestAsset = await reqManager.getRequestAssetById(
      requestId,
      assetId
    );
    if (requestAsset.error) {
      console.log(requestAsset.error);
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return requestAsset;
  }

  @Post("/{requestId}/score")
  public async addScores(
    @Body()
    requestBody: ScoreRequest,
    @Request() request: JawnAuthenticatedRequest,
    @Path() requestId: string
  ): Promise<Result<null, string>> {
    const scoreManager = new ScoreManager(request.authParams);

    const result = await scoreManager.addScores(requestId, requestBody.scores);
    if (result.error) {
      this.setStatus(500);
      return err("Error adding scores to request.");
    } else {
      this.setStatus(201);
      return ok(null);
    }
  }
}
