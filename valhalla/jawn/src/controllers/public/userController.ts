// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { dbQueryClickhouse } from "../../lib/shared/db/dbExecute";
import {
  FilterLeaf,
  FilterLeafSubset,
  filterListToTree,
} from "../../lib/shared/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "../../lib/shared/filters/filters";
import { Result } from "../../lib/shared/result";
import { PSize, SortLeafUsers, UserManager } from "../../managers/UserManager";
import { clickhousePriceCalc } from "../../packages/cost";
import { JawnAuthenticatedRequest } from "../../types/request";

export interface UserQueryParams {
  userIds?: string[];
  timeFilter?: {
    startTimeUnixSeconds: number;
    endTimeUnixSeconds: number;
  };
}

export type UserFilterBranch = {
  left: UserFilterNode;
  operator: "or" | "and";
  right: UserFilterNode;
};

type UserFilterNode =
  | FilterLeafSubset<"user_metrics" | "request_response_rmt">
  | UserFilterBranch
  | "all";
export interface UserMetricsQueryParams {
  filter: UserFilterNode;
  offset: number;
  limit: number;
  timeFilter?: {
    startTimeUnixSeconds: number;
    endTimeUnixSeconds: number;
  };
  timeZoneDifferenceMinutes?: number;
  sort?: SortLeafUsers;
}
export interface UserMetricsResult {
  id: string;
  user_id: string;
  active_for: number;
  first_active: string;
  last_active: string;
  total_requests: number;
  average_requests_per_day_active: number;
  average_tokens_per_request: number;
  total_completion_tokens: number;
  total_prompt_tokens: number;
  cost: number;
}

@Route("v1/user")
@Tags("User")
@Security("api_key")
export class UserController extends Controller {
  @Post("metrics-overview/query")
  public async getUserMetricsOverview(
    @Body()
    requestBody: {
      filter: UserFilterNode;
      pSize: PSize;
      useInterquartile: boolean;
    },
    @Request() request: JawnAuthenticatedRequest
  ) {
    const userManager = new UserManager(request.authParams);
    return userManager.getUserMetricsOverview(
      requestBody.filter,
      requestBody.pSize,
      requestBody.useInterquartile
    );
  }

  @Post("metrics/query")
  public async getUserMetrics(
    @Body()
    requestBody: UserMetricsQueryParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{ users: UserMetricsResult[]; count: number }, string>> {
    const userManager = new UserManager(request.authParams);
    if (requestBody.limit > 1000) {
      this.setStatus(400);
      return {
        error: "Limit cannot be greater than 1000",
        data: null,
      };
    }

    const result = await userManager.getUserMetrics(requestBody);
    if (result.error) {
      this.setStatus(400);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("query")
  public async getUsers(
    @Body()
    requestBody: UserQueryParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<
    Result<
      {
        count: number;
        prompt_tokens: number;
        completion_tokens: number;
        user_id: string;
        cost_usd: number;
      }[],
      string
    >
  > {
    const filters: FilterLeaf[] =
      requestBody.userIds?.map((userId) => ({
        request_response_rmt: {
          user_id: {
            equals: userId,
          },
        },
      })) ?? [];

    const endTime = new Date(
      requestBody.timeFilter?.endTimeUnixSeconds ?? Date.now()
    );
    const startTime = new Date(
      requestBody.timeFilter?.startTimeUnixSeconds ?? 0
    );
    const filter = await buildFilterWithAuthClickHouse({
      argsAcc: [],
      filter: {
        left: filterListToTree(filters, "or"),
        right: {
          right: {
            request_response_rmt: {
              request_created_at: {
                gte: startTime,
              },
            },
          },
          left: {
            request_response_rmt: {
              request_created_at: {
                lte: endTime,
              },
            },
          },
          operator: "and",
        },
        operator: "and",
      },
      org_id: request.authParams.organizationId,
    });
    const users = dbQueryClickhouse<{
      count: number;
      prompt_tokens: number;
      completion_tokens: number;
      user_id: string;
      cost_usd: number;
    }>(
      `
    SELECT 
      count(*) as count, 
      sum(prompt_tokens) as prompt_tokens, 
      sum(completion_tokens) as completion_tokens, 
      user_id,
      ${clickhousePriceCalc("request_response_rmt")} as cost_usd
      from request_response_rmt
    WHERE (
      ${filter.filter}
    )
    GROUP BY user_id
    LIMIT 100
    `,
      filter.argsAcc
    );
    return users;
  }
}
