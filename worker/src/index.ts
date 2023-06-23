import { getProvider as getProvider } from "./helpers";
import { RequestWrapper } from "./lib/RequestWrapper";
import baseRouter from "./routers/baseRouter";

export interface Env {
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_URL: string;
  TOKENIZER_COUNT_API: string;
  TOKEN_COUNT_URL: string;
  RATE_LIMIT_KV: KVNamespace;
  CLICKHOUSE_HOST: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
  PROVIDER: "OPENAI" | "ANTHROPIC";
  TOKEN_CALC_URL: string;
}

export enum Provider {
  ANTHROPIC = "ANTHROPIC",
  OPENAI = "OPENAI",
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

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      
      const requestWrapper = new RequestWrapper(request);
      const provider = getProvider(requestWrapper, env);
      requestWrapper.provider = provider;
      env.PROVIDER = provider;

      return baseRouter.handle(request, requestWrapper, env, ctx).catch(handleError);
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
