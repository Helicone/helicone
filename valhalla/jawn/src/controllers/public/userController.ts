// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { Result } from "../../lib/modules/result";
import { dbQueryClickhouse } from "../../lib/shared/db/dbExecute";
import {
  FilterLeaf,
  filterListToTree,
} from "../../lib/shared/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "../../lib/shared/filters/filters";
import { JawnAuthenticatedRequest } from "../../types/request";

export interface UserQueryParams {
  userIds?: string[];
  timeFilter?: {
    startTimeUnixSeconds: number;
    endTimeUnixSeconds: number;
  };
}

@Route("v1/user")
@Tags("Request")
@Security("api_key")
export class UserController extends Controller {
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
      }[],
      string
    >
  > {
    const filters: FilterLeaf[] =
      requestBody.userIds?.map((userId) => ({
        request_response_log: {
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
            request_response_log: {
              request_created_at: {
                gte: startTime,
              },
            },
          },
          left: {
            request_response_log: {
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
    }>(
      `
    SELECT 
      count(*) as count, 
      sum(prompt_tokens) as prompt_tokens, 
      sum(completion_tokens) as completion_tokens, 
      user_id
    from request_response_log
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
