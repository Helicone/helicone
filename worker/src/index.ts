import { createClient } from "@supabase/supabase-js";
import { Database } from "../supabase/database.types";
import { InMemoryRateLimiter } from "./db/InMemoryRateLimiter";
import { RequestWrapper } from "./lib/RequestWrapper";
import { RosettaWrapper } from "./lib/rosetta/RosettaWrapper";
import { updateLoopUsers } from "./lib/updateLoopsUsers";
import { buildRouter } from "./routers/routerFactory";
import { AlertManager } from "./AlertManager";
import { AlertStore } from "./db/AlertStore";
import { ClickhouseClientWrapper } from "./lib/db/clickhouse";

const FALLBACK_QUEUE = "fallback-queue";

export type Provider = "OPENAI" | "ANTHROPIC" | "CUSTOM" | string;

export interface Env {
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_URL: string;
  TOKENIZER_COUNT_API: string;
  TOKEN_COUNT_URL: string;
  RATE_LIMIT_KV: KVNamespace;
  CACHE_KV: KVNamespace;
  REQUEST_AND_RESPONSE_QUEUE_KV: KVNamespace;
  UTILITY_KV: KVNamespace;
  CLICKHOUSE_HOST: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
  WORKER_TYPE:
    | "OPENAI_PROXY"
    | "ANTHROPIC_PROXY"
    | "HELICONE_API"
    | "GATEWAY_API"
    | "CUSTOMER_GATEWAY";
  TOKEN_CALC_URL: string;
  VAULT_ENABLED: string;
  STORAGE_URL: string;
  FALLBACK_QUEUE: Queue<unknown>;
  LOOPS_API_KEY: string;
  REQUEST_CACHE_KEY: string;
  SECURE_CACHE: KVNamespace;
  RATE_LIMITER: DurableObjectNamespace;
  OPENAI_API_KEY: string;
  OPENAI_ORG_ID: string;
  ROSETTA_HELICONE_API_KEY: string;
  CUSTOMER_GATEWAY_URL?: string;
  VALHALLA_URL: string;
  ALERTER: DurableObjectNamespace;
  RESEND_API_KEY: string;
  PROMPTARMOR_API_KEY: string;
  DATADOG_API_KEY: string;
  DATADOG_ENDPOINT: string;
  S3_BUCKET_NAME: string;
  S3_ENDPOINT: string;
  S3_ACCESS_KEY: string;
  S3_SECRET_KEY: string;
}

export async function hash(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashedKey = await crypto.subtle.digest(
    { name: "SHA-256" },
    encoder.encode(key)
  );
  const byteArray = Array.from(new Uint8Array(hashedKey));
  const hexCodes = byteArray.map((value) => {
    const hexCode = value.toString(16);
    const paddedHexCode = hexCode.padStart(2, "0");
    return paddedHexCode;
  });
  return hexCodes.join("");
}

// If the url starts with oai.*.<>.com then we know WORKER_TYPE is OPENAI_PROXY
function modifyEnvBasedOnPath(env: Env, request: RequestWrapper): Env {
  if (env.WORKER_TYPE) {
    return env;
  }
  const url = new URL(request.getUrl());
  const host = url.host;
  const hostParts = host.split(".");

  if (host.includes("hconeai") && hostParts.length >= 3) {
    // hconeai.com requests
    if (hostParts[0].includes("gateway")) {
      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
      };
    } else if (hostParts[0].includes("oai")) {
      return {
        ...env,
        WORKER_TYPE: "OPENAI_PROXY",
      };
    } else if (hostParts[0].includes("anthropic")) {
      return {
        ...env,
        WORKER_TYPE: "ANTHROPIC_PROXY",
      };
    } else if (hostParts[0].includes("api")) {
      return {
        ...env,
        WORKER_TYPE: "HELICONE_API",
      };
    }
  }

  if (
    hostParts.length >= 3 &&
    hostParts[0].includes("gateway") &&
    !host.includes("hconeai")
  ) {
    // if it is not a hconeai.com request, but it is a gateway request, then it is a customer gateway request
    return {
      ...env,
      WORKER_TYPE: "CUSTOMER_GATEWAY",
    };
  }

  throw new Error("Could not determine worker type");
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      const requestWrapper = await RequestWrapper.create(request, env);
      if (requestWrapper.error || !requestWrapper.data) {
        return handleError(requestWrapper.error);
      }
      env = modifyEnvBasedOnPath(env, requestWrapper.data);
      const router = buildRouter(env.WORKER_TYPE);
      return router
        .handle(request, requestWrapper.data, env, ctx)
        .catch(handleError);
    } catch (e) {
      return handleError(e);
    }
  },
  async queue(_batch: MessageBatch<string>, _env: Env): Promise<void> {
    if (_batch.queue.includes(FALLBACK_QUEUE)) {
      throw new Error("Fallback queue not implemented");
    } else {
      console.error(`Unknown queue: ${_batch.queue}`);
    }
  },
  async scheduled(
    controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    const supabaseClient = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );
    await updateLoopUsers(env);
    if (controller.cron === "0 * * * *") {
      const rosetta = new RosettaWrapper(supabaseClient, env);
      await rosetta.generateMappers();
    } else {
      const alertManager = new AlertManager(
        new AlertStore(supabaseClient, new ClickhouseClientWrapper(env)),
        env
      );

      const { error: checkAlertErr } = await alertManager.checkAlerts();

      if (checkAlertErr) {
        console.error(`Failed to check alerts: ${checkAlertErr}`);
      }
    }
  },
};

function handleError(e: unknown): Response {
  console.error(e);
  return new Response(
    JSON.stringify({
      "helicone-message":
        "Helicone ran into an error servicing your request: " + e,
      support:
        "Please reach out on our discord or email us at help@helicone.ai, we'd love to help!",
      "helicone-error": JSON.stringify(e),
    }),
    {
      status: 500,
      headers: {
        "content-type": "application/json;charset=UTF-8",
        "helicone-error": "true",
      },
    }
  );
}
export { InMemoryRateLimiter };
