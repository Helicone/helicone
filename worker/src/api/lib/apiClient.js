import { createClient } from "@supabase/supabase-js";
import { DBWrapper } from "../../lib/db/DBWrapper";
import { ClickhouseClientWrapper } from "../../lib/db/ClickhouseWrapper";
import { Valhalla } from "../../lib/db/valhalla";
import { RequestResponseStore } from "../../lib/db/RequestResponseStore";
import { DBQueryTimer } from "../../lib/util/loggers/DBQueryTimer";
class InternalResponse {
    client;
    constructor(client) {
        this.client = client;
    }
    newError(message, status) {
        console.error(`Response Error: `, message);
        return new Response(JSON.stringify({ error: message }), { status });
    }
    successJSON(data, enableCors = false) {
        if (enableCors) {
            return new Response(JSON.stringify(data), {
                status: 200,
                headers: {
                    "content-type": "application/json;charset=UTF-8",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "PUT",
                    "Access-Control-Allow-Headers": "Content-Type, helicone-jwt, helicone-org-id",
                },
            });
        }
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                "content-type": "application/json;charset=UTF-8",
            },
        });
    }
    unauthorized() {
        return this.newError("Unauthorized", 401);
    }
}
export class APIClient {
    env;
    ctx;
    requestWrapper;
    queue;
    response;
    db;
    heliconeApiKeyRow;
    constructor(env, ctx, requestWrapper, auth) {
        this.env = env;
        this.ctx = ctx;
        this.requestWrapper = requestWrapper;
        this.response = new InternalResponse(this);
        this.db = new DBWrapper(env, auth);
        this.queue = new RequestResponseStore(createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY), new DBQueryTimer(ctx, {
            enabled: (env.DATADOG_ENABLED ?? "false") === "true",
            apiKey: env.DATADOG_API_KEY,
            endpoint: env.DATADOG_ENDPOINT,
        }), new Valhalla(env.VALHALLA_URL, auth), new ClickhouseClientWrapper(env), env.FALLBACK_QUEUE, env.REQUEST_AND_RESPONSE_QUEUE_KV);
    }
}
export async function createAPIClient(env, ctx, requestWrapper) {
    const auth = await requestWrapper.auth();
    if (auth.error !== null) {
        throw new Error(auth.error);
    }
    return new APIClient(env, ctx, requestWrapper, auth.data);
}
