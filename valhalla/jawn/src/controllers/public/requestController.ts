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
import { Result } from "../../lib/modules/result";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { SortLeafRequest } from "../../lib/shared/sorts/requests/sorts";
import { HeliconeRequest } from "../../lib/stores/request/request";
import { RequestManager } from "../../managers/request/RequestManager";
import { JawnAuthenticatedRequest } from "../../types/request";

export interface RequestQueryParams {
  filter: FilterNode;
  offset?: number;
  limit?: number;
  sort?: SortLeafRequest;
  isCached?: boolean;
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
   *  }
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
}
