import { z } from "zod";

import { Env } from "../../..";
import { RequestWrapper } from "../../../lib/RequestWrapper";
import { AuthParams } from "../../../lib/dbLogger/DBLoggable";
import { APIClient } from "../../lib/apiClient";
import { BaseAPIRoute } from "../baseAPIRoute";

const ReturnBody = z
  .object({
    id: z.string(),
    version: z.number(),
    heliconeTemplate: z.any(),
  })
  .array();

type ReturnBodyType = z.infer<typeof ReturnBody>;

export class PromptsGet extends BaseAPIRoute {
  static schema = {
    tags: ["Prompt"],
    summary: "All the prompts you have access to",
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
    const prompts = await client.db
      .getClient()
      .from("prompts")
      .select("*")

      .eq("organization_id", authParams.organizationId);

    if (prompts.error) {
      throw new Error(JSON.stringify(prompts.error));
    }

    return prompts.data.map((p) => ({
      id: p.id,
      version: p.version,
      heliconeTemplate: p.heliconeTemplate,
    }));
  }
}
