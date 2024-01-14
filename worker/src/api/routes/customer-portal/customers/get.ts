import { z } from "zod";

import { OpenAPIRoute, Path, Str } from "@cloudflare/itty-router-openapi";
import { IRequest } from "itty-router";
import { Env, Provider } from "../../../..";
import { RequestWrapper } from "../../../../lib/RequestWrapper";

const BodyOpenAPI = z.object({
  name: z.string(),
  description: z.string().or(z.string().array()),
  steps: z.string().array(),
});

type BodyType = z.infer<typeof BodyOpenAPI>;

export class CustomersGet extends OpenAPIRoute<
  IRequest,
  [RequestWrapper, Env, ExecutionContext, Provider]
> {
  static schema = {
    tags: ["Tasks"],
    summary: "Get a single Task by slug",
    requestBody: BodyOpenAPI,
    parameters: {
      taskSlug: Path(Str, {
        description: "Task slug",
      }),
    },
    responses: {
      "200": {
        description: "Task fetched successfully",
        schema: {
          metaData: {},
          task: BodyOpenAPI,
        },
      },
    },
  };

  async handle(
    _: unknown,
    requestWrapper: RequestWrapper,
    env: Env,
    _ctx: ExecutionContext
  ) {
    type User = z.infer<typeof BodyOpenAPI>;

    // Retrieve the validated slug
    // const { taskSlug } = requestWrapper.getJson<BodyType>();

    // Actually fetch a task using the taskSlug

    return {
      metaData: { meta: "data" },
      task: {
        name: "my task",
        // slug: taskSlug,
        description: "this needs to be done",
        completed: false,
        // due_date: new Date().toISOString().slice(0, 10),
      },
    };
  }
}
