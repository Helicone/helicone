import { z } from "zod";

import { Path, Str } from "@cloudflare/itty-router-openapi";
import { IRequest } from "itty-router";
import { Env } from "../../../../..";
import { RequestWrapper } from "../../../../../lib/RequestWrapper";
import { AuthParams } from "../../../../../lib/dbLogger/DBLoggable";
import { APIClient } from "../../../../lib/apiClient";
import { BaseAPIRoute } from "../../../baseAPIRoute";

const ReturnBody = z
  .object({
    providerKey: z.string(),
  })
  .array();

type ReturnBodyType = z.infer<typeof ReturnBody>;

export class ProviderKeyGet extends BaseAPIRoute {
  static schema = {
    tags: ["Customer Portal"],
    summary: "Gets the provider key for a customer",
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
  }: {
    request: IRequest;
    requestWrapper: RequestWrapper;
    env: Env;
    ctx: ExecutionContext;
    client: APIClient;
    authParams: AuthParams;
  }): Promise<ReturnBodyType> {
    const {
      params: { customerId },
    } = request;
    const customer = await client.db
      .getClient()
      .oneOrNone(
        `SELECT * FROM organization
         WHERE reseller_id = $1
         AND id = $2
         AND organization_type = 'customer'
         AND soft_delete = false`,
        [authParams.organizationId, customerId]
      );

    if (!customer) {
      throw new Error("Customer not found");
    }

    const providerKey = await client.db
      .getClient()
      .oneOrNone(
        `SELECT * FROM decrypted_provider_keys
         WHERE provider_key = $1`,
        [customer.org_provider_key ?? ""]
      );

    return [
      {
        providerKey: providerKey?.provider_key ?? "",
      },
    ];
  }
}
