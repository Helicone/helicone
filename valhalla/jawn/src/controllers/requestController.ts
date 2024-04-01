// src/users/usersController.ts
import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Query,
  Route,
  Security,
  Request,
  SuccessResponse,
  Tags,
} from "tsoa";
import { User } from "../models/user";
import express from "express";
import { UsersService, UserCreationParams } from "../managers/usersService";
import { JawnAuthenticatedRequest } from "../types/request";
import { Result, ok } from "../lib/modules/result";
import {
  HeliconeRequest,
  getRequests,
  getRequestsCached,
} from "../lib/stores/request/request";
import { FilterLeaf, FilterNode } from "../lib/shared/filters/filterDefs";
import { SortLeafRequest } from "../lib/shared/sorts/requests/sorts";
import { RequestManager } from "../managers/request/RequestManager";

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
