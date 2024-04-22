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
  includeInputs?: boolean;
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
      console.log(requestFeedback.error);
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
}
