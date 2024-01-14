import { z } from "zod";

import { OpenAPIRoute, Path, Str } from "@cloudflare/itty-router-openapi";
import { IRequest } from "itty-router";
import { Env, Provider } from "../../../..";
import { RequestWrapper } from "../../../../lib/RequestWrapper";

const ReturnBody = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().or(z.string().array()),
  steps: z.string().array(),
});

type ReturnBodyType = z.infer<typeof ReturnBody>;

export class CustomerGet extends OpenAPIRoute<
  IRequest,
  [RequestWrapper, Env, ExecutionContext, Provider]
> {
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

  async handle(
    _: unknown,
    requestWrapper: RequestWrapper,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<ReturnBodyType> {
    // Actually fetch a task using the taskSlug

    return {
      description: "this needs to be done",
      id: "123",
      name: "my task",
      steps: ["step 1", "step 2"],

      // metaData: { meta: "data" },
      // task: {
      //   name: "my task",
      //   // slug: taskSlug,
      //   description: "this needs to be done",
      //   completed: false,
      //   // due_date: new Date().toISOString().slice(0, 10),
      // },
    };
  }
}
