import { RequestWrapper } from "./lib/RequestWrapper";
import { buildRouter } from "./routers/routerFactory";

export type Provider = "OPENAI" | "ANTHROPIC";

export interface Env {
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_URL: string;
  TOKENIZER_COUNT_API: string;
  TOKEN_COUNT_URL: string;
  RATE_LIMIT_KV: KVNamespace;
  CACHE_KV: KVNamespace;
  CLICKHOUSE_HOST: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
  WORKER_TYPE: "OPENAI_PROXY" | "ANTHROPIC_PROXY" | "HELICONE_API";
  TOKEN_CALC_URL: string;
}

export async function hash(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashedKey = await crypto.subtle.digest({ name: "SHA-256" }, encoder.encode(key));
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
  if (hostParts.length >= 3 && hostParts[0].includes("oai")) {
    return {
      ...env,
      WORKER_TYPE: "OPENAI_PROXY",
    };
  } else if (hostParts.length >= 3 && hostParts[0].includes("anthropic")) {
    return {
      ...env,
      WORKER_TYPE: "ANTHROPIC_PROXY",
    };
  } else if (hostParts.length >= 3 && hostParts[0].includes("api")) {
    return {
      ...env,
      WORKER_TYPE: "HELICONE_API",
    };
  } else {
    throw new Error("Could not determine worker type");
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const requestWrapper = new RequestWrapper(request);
      env = modifyEnvBasedOnPath(env, requestWrapper);
      const router = buildRouter(env.WORKER_TYPE);
      return router.handle(request, requestWrapper, env, ctx).catch(handleError);
    } catch (e) {
      return handleError(e);
    }
  },
};

function handleError(e: any): Response {
  console.error(e);
  return new Response(
    JSON.stringify({
      "helicone-message": "Helicone ran into an error servicing your request: " + e,
      support: "Please reach out on our discord or email us at help@helicone.ai, we'd love to help!",
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
