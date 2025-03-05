// src/users/usersController.ts
import {
  Body,
  Controller,
  Example,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import {
  all,
  Filter,
  FilterExpression,
} from "../../lib/shared/filters/filterAst";
import { Result } from "../../lib/shared/result";
import { SortLeafRequest } from "../../lib/shared/sorts/requests/sorts";
import { RequestManager } from "../../managers/request/RequestManager";
import { HeliconeRequest } from "../../packages/llm-mapper/types";
import { JawnAuthenticatedRequest } from "../../types/request";

export interface RequestQueryParams {
  filter: FilterExpression;
  offset?: number;
  limit?: number;
  sort?: SortLeafRequest;
  isCached?: boolean;
  includeInputs?: boolean;
  isPartOfExperiment?: boolean;
  isScored?: boolean;
}

@Route("v2/request")
@Tags("Request")
@Security("api_key")
export class RequestV2Controller extends Controller {
  /**
   *
   * @param requestBody Request query filters
   * @example requestBody {
   *  "filter": {
   *    "type": "all"
   *  },
   *  "isCached": false,
   *  "limit": 100,
   *  "offset": 0,
   *  "sort": {
   *    "created_at": "desc"
   *  },
   *  "includeInputs": false,
   *  "isScored": false,
   *  "isPartOfExperiment": false
   * }
   * @param request
   * @returns
   */
  @Post("query-clickhouse")
  @Example<RequestQueryParams>({
    filter: all(),
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
    const requests = await reqManager.getRequestsClickhouse({
      ...requestBody,
      filter: Filter.toLegacy(requestBody.filter),
    });
    if (requests.error || !requests.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200); // set return status 201
    }
    return requests;
  }
}
