import { z } from "zod";

import { OpenAPIRoute, Path, Str } from "@cloudflare/itty-router-openapi";
import { IRequest } from "itty-router";
import { Env, Provider } from "../../.";
import { RequestWrapper } from "../../lib/RequestWrapper";
import { createAPIClient, APIClient } from "../lib/apiClient";
import { AuthParams } from "../../lib/dbLogger/DBLoggable";
import { ClickhouseClientWrapper } from "../../lib/db/clickhouse";

export abstract class BaseAPIRoute extends OpenAPIRoute<
  IRequest,
  [RequestWrapper, Env, ExecutionContext, Provider]
> {
  abstract heliconeHandle(params: {
    request: IRequest;
    requestWrapper: RequestWrapper;
    env: Env;
    ctx: ExecutionContext;
    client: APIClient;
    authParams: AuthParams;
    clickhouse: ClickhouseClientWrapper;
  }): Promise<any>;

  async handle(
    request: IRequest,
    requestWrapper: RequestWrapper,
    env: Env,
    ctx: ExecutionContext
  ) {
    const client = await createAPIClient(env, requestWrapper);
    const authParams = await client.db.getAuthParams();
    if (authParams.error !== null) {
      return client.response.unauthorized();
    }

    return this.heliconeHandle({
      request,
      requestWrapper,
      env,
      ctx,
      client,
      authParams: authParams.data,
      clickhouse: new ClickhouseClientWrapper(env),
    });
  }
}
