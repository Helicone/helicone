import { OpenAPIRoute } from "@cloudflare/itty-router-openapi";
import { IRequest } from "itty-router";
import { Env, Provider } from "../../.";
import { RequestWrapper } from "../../lib/RequestWrapper";
import { ClickhouseClientWrapper } from "../../lib/db/clickhouse";
import { AuthParams } from "../../lib/dbLogger/DBLoggable";
import { APIClient, createAPIClient } from "../lib/apiClient";

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
  }): Promise<unknown>;

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
