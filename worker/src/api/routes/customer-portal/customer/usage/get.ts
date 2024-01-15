import { z } from "zod";

import { OpenAPIRoute, Path, Str } from "@cloudflare/itty-router-openapi";
import { IRequest } from "itty-router";
import { Env, Provider } from "../../../../..";
import { RequestWrapper } from "../../../../../lib/RequestWrapper";
import { BaseAPIRoute } from "../../../baseAPIRoute";
import { APIClient } from "../../../../lib/apiClient";
import { AuthParams } from "../../../../../lib/dbLogger/DBLoggable";
import { ClickhouseClientWrapper } from "../../../../../lib/db/clickhouse";
import { CLICKHOUSE_PRICE_CALC } from "../../../../../lib/limits/check";

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
    requestWrapper,
    env,
    ctx,
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
        ${CLICKHOUSE_PRICE_CALC("response_copy_v3")} as cost,
        count(response_copy_v3.prompt_tokens) as prompt_tokens,
        count(response_copy_v3.completion_tokens) as completion_tokens
      FROM response_copy_v3
      WHERE (
        response_copy_v3.organization_id = {val_0 : String}
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
