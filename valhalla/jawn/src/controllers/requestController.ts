// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { Result } from "../lib/modules/result";
import { FilterNode } from "../lib/shared/filters/filterDefs";
import { SortLeafRequest } from "../lib/shared/sorts/requests/sorts";
import { HeliconeRequest } from "../lib/stores/request/request";
import { RequestManager } from "../managers/request/RequestManager";
import { JawnAuthenticatedRequest } from "../types/request";

export interface RequestQueryParams {
  filter: FilterNode;
  offset: number;
  limit: number;
  sort: SortLeafRequest;
  isCached: boolean;
}

@Route("v1/request/v2")
@Tags("Request")
@Security("api_key")
export class RequestController extends Controller {
  @Post("query")
  public async getRequests(
    @Body()
    requestBody: RequestQueryParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<HeliconeRequest[], string>> {
    const reqManager = new RequestManager(request.authParams);
    const requests = await reqManager.getRequests(requestBody);
    if (requests.error || !requests.data) {
      this.setStatus(500);
      throw new Error(requests.error);
    } else {
      this.setStatus(200); // set return status 201
      return requests;
    }
  }
}
