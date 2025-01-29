import { z } from "zod";

import { Env } from "../../../..";
import { RequestWrapper } from "../../../../lib/RequestWrapper";
import { AuthParams } from "../../../../lib/dbLogger/DBLoggable";
import { APIClient } from "../../../lib/apiClient";
import { BaseAPIRoute } from "../../baseAPIRoute";

const ReturnBody = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .array();

type ReturnBodyType = z.infer<typeof ReturnBody>;

export class CustomerGet extends BaseAPIRoute {
  static schema = {
    tags: ["Customer Portal"],
    summary: "Gets all of your customers that you have access to",
    // requestBody: BodyOpenAPI,
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
    client,
    authParams,
  }: {
    request: Request;
    requestWrapper: RequestWrapper;
    env: Env;
    ctx: ExecutionContext;
    client: APIClient;
    authParams: AuthParams;
  }): Promise<ReturnBodyType> {
    const customers = await client.db
      .getClient()
      .from("organization")
      .select("*")
      .eq("reseller_id", authParams.organizationId)
      .eq("organization_type", "customer")
      .eq("soft_delete", false);

    if (customers.error) {
      throw new Error(JSON.stringify(customers.error));
    }

    return customers.data.map((customer) => ({
      id: customer.id,
      name: customer.name,
    }));
  }
}
