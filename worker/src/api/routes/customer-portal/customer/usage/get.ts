import { z } from "zod";

import { Path, Str } from "@cloudflare/itty-router-openapi";
import { IRequest } from "itty-router";
import { Env } from "../../../../..";
import { RequestWrapper } from "../../../../../lib/RequestWrapper";
import { ClickhouseClientWrapper } from "../../../../../lib/db/ClickhouseWrapper";
import { AuthParams } from "../../../../../lib/dbLogger/DBLoggable";
import { APIClient } from "../../../../lib/apiClient";
import { BaseAPIRoute } from "../../../baseAPIRoute";
import { clickhousePriceCalc } from "../../../../../packages/cost";

const ReturnBody = z
  .object({
    id: z.string(),
    name: z.string(),
    cost: z.number(),
    count: z.number(),
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
  })
  .array();

type ReturnBodyType = z.infer<typeof ReturnBody>;

export class CustomerUsageGet extends BaseAPIRoute {
  static schema = {
    tags: ["Customer Portal"],
    summary: "Gets all of your customers that you have access to",
    // requestBody: BodyOpenAPI,
    parameters: {
      customerId: Path(Str, {
        description: "customer id",
      }),
    },
    responses: {
      "200": {
        description: "Task fetched successfully",
        schema: {
          metaData: {},
          task: ReturnBody,
        },
      },
    },
  };

  async heliconeHandle({
    request,
    client,
    authParams,
    clickhouse,
  }: {
    request: IRequest;
    requestWrapper: RequestWrapper;
    env: Env;
    ctx: ExecutionContext;
    client: APIClient;
    authParams: AuthParams;
    clickhouse: ClickhouseClientWrapper;
  }): Promise<ReturnBodyType> {
    const {
      params: { customerId },
    } = request;
    const customers = await client.db
      .getClient()
      .from("organization")
      .select("*")
      .eq("reseller_id", authParams.organizationId)
      .eq("id", customerId)
      .eq("organization_type", "customer")
      .eq("soft_delete", "false")
      .single();

    if (customers.error) {
      throw new Error(JSON.stringify(customers.error));
    }
    const { data, error } = await clickhouse.dbQuery<{
      count: number;
      cost: number;
      prompt_tokens: number;
      completion_tokens: number;
    }>(
      `
      SELECT
        count(*) as count,
        ${clickhousePriceCalc("request_response_log")} as cost,
        count(request_response_log.prompt_tokens) as prompt_tokens,
        count(request_response_log.completion_tokens) as completion_tokens
      FROM request_response_log
      WHERE (
        request_response_log.organization_id = {val_0 : String}
      )
    `,
      [customerId]
    );

    if (error || !data) {
      console.error("Error checking limits:", error);
      throw new Error(JSON.stringify(error));
    }
    const { cost, count, prompt_tokens, completion_tokens } = data[0];
    return [
      {
        id: customers.data.id,
        name: customers.data.name,
        cost,
        count,
        prompt_tokens,
        completion_tokens,
      },
    ];
  }
}
