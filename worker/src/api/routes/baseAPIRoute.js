import { OpenAPIRoute } from "@cloudflare/itty-router-openapi";
import { ClickhouseClientWrapper } from "../../lib/db/ClickhouseWrapper";
import { createAPIClient } from "../lib/apiClient";
export class BaseAPIRoute extends OpenAPIRoute {
    async handle(request, requestWrapper, env, ctx, data) {
        const client = await createAPIClient(env, ctx, requestWrapper);
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
            data: data,
        });
    }
}
