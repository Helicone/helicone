// src/users/usersController.ts
import {
  Body,
  Controller,
  Example,
  Path,
  Post,
  Put,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { FilterLeafSubset } from "../../lib/shared/filters/filterDefs";
import { err, ok, Result } from "../../lib/shared/result";
import { SortLeafRequest } from "../../lib/shared/sorts/requests/sorts";
import {
  HeliconeRequest,
  HeliconeRequestAsset,
} from "../../lib/stores/request/request";
import { RequestManager } from "../../managers/request/RequestManager";
import { JawnAuthenticatedRequest } from "../../types/request";
import { ScoreManager, ScoreRequest } from "../../managers/score/ScoreManager";

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
      | "request_response_search"
      | "cache_hits"
      | "request_response_rmt"
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
  /**
   *
   * @param requestBody Request query filters
   * @example requestBody {
   *  "filter": "all",
   *  "isCached": false,
   *  "limit": 10,
   *  "offset": 0,
   *  "sort": {
   *    "created_at": "desc"
   *  },
   *  "isScored": false,
   *  "isPartOfExperiment": false
   * }
   * @param request
   * @returns
   */
  @Post("query")
  @Example<RequestQueryParams>({
    filter: "all",
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
    const requests = await reqManager.getRequests(requestBody);
    if (requests.error || !requests.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200); // set return status 201
    }
    return requests;
  }

  /**
   *
   * @param requestBody Request query filters
   * @example requestBody {
   *  "filter": "all",
   *  "isCached": false,
   *  "limit": 10,
   *  "offset": 0,
   *  "sort": {
   *    "created_at": "desc"
   *  },
   *  "isScored": false,
   *  "isPartOfExperiment": false
   * }
   * @param request
   * @returns
   */
  @Post("query-clickhouse")
  @Example<RequestQueryParams>({
    filter: "all",
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
    const reqManager = new RequestManager(request.authParams);
    const requests = await reqManager.getRequestsClickhouse(requestBody);
    if (requests.error || !requests.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200); // set return status 201
    }
    return requests;
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
      this.setStatus(200); // set return status 201
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
      this.setStatus(200); // set return status 201
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
