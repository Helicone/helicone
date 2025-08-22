/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";
import { Database } from "../supabase/database.types";
import { InMemoryRateLimiter } from "./lib/clients/InMemoryRateLimiter";
import { RateLimiterDO } from "./lib/durable-objects/RateLimiterDO";
import { AlertStore } from "./lib/db/AlertStore";
import { ClickhouseClientWrapper } from "./lib/db/ClickhouseWrapper";
import { AlertManager } from "./lib/managers/AlertManager";
import { updateLoopUsers } from "./lib/managers/LoopsManager";
import { RequestWrapper } from "./lib/RequestWrapper";
import { ProviderName } from "@helicone-package/cost/providers/mappings";
import { buildRouter } from "./routers/routerFactory";
import { ReportManager } from "./lib/managers/ReportManager";
import { ReportStore } from "./lib/db/ReportStore";
import { ProviderKeysManager } from "./lib/managers/ProviderKeysManager";
import { ProviderKeysStore } from "./lib/db/ProviderKeysStore";
import { APIKeysStore } from "./lib/db/APIKeysStore";
import { APIKeysManager } from "./lib/managers/APIKeysManager";

const FALLBACK_QUEUE = "fallback-queue";

export type Provider = ProviderName | "CUSTOM";

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

function isRootPath(url: URL) {
  return url.pathname === "/" || url.pathname === "" || !url.pathname;
}

// If the url starts with oai.*.<>.com then we know WORKER_TYPE is OPENAI_PROXY
async function modifyEnvBasedOnPath(
  env: Env,
  request: RequestWrapper
): Promise<Env> {
  const url = new URL(request.getUrl());
  const host = url.host;
  const hostParts = host.split(".");
  if (request.isEU()) {
    env = {
      ...env,
      CLICKHOUSE_HOST: env.EU_CLICKHOUSE_HOST,
      CLICKHOUSE_USER: env.EU_CLICKHOUSE_USER,
      CLICKHOUSE_PASSWORD: env.EU_CLICKHOUSE_PASSWORD,
      SUPABASE_SERVICE_ROLE_KEY: env.EU_SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_URL: env.EU_SUPABASE_URL,
      S3_BUCKET_NAME: env.EU_S3_BUCKET_NAME,
      SECURE_CACHE: env.EU_SECURE_CACHE,
      REQUEST_LOGS_QUEUE_URL: env.EU_REQUEST_LOGS_QUEUE_URL,
      REQUEST_LOGS_QUEUE_URL_LOW_PRIORITY:
        env.EU_REQUEST_LOGS_QUEUE_URL_LOW_PRIORITY,
      S3_REGION: "eu-west-1",
      AWS_REGION: env.EU_AWS_REGION ?? "eu-west-1",
    };
  }
  if (env.WORKER_TYPE) {
    return env;
  }

  if (
    (host.includes("hconeai") || host.includes("helicone.ai")) &&
    hostParts.length >= 3
  ) {
    // helicone.ai requests
    if (hostParts[0].includes("ai-gateway")) {
      return {
        ...env,
        WORKER_TYPE: "AI_GATEWAY_API",
      };
    } else if (hostParts[0].includes("gateway")) {
      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
      };
    } else if (hostParts[0].includes("generate")) {
      return {
        ...env,
        WORKER_TYPE: "GENERATE_API",
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
    } else if (hostParts[0].includes("vercel")) {
      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
        GATEWAY_TARGET: "https://ai-gateway.vercel.sh",
      };
    } else if (hostParts[0].includes("together")) {
      if (isRootPath(url) && request.getMethod() === "GET") {
        return {
          ...env,
          WORKER_DEFINED_REDIRECT_URL: "https://together.xyz",
        };
      } else {
        return {
          ...env,
          WORKER_TYPE: "GATEWAY_API",
          GATEWAY_TARGET: "https://api.together.xyz",
        };
      }
    } else if (hostParts[0].includes("llmmapper")) {
      if (isRootPath(url) && request.getMethod() === "GET") {
        return {
          ...env,
          WORKER_DEFINED_REDIRECT_URL: "THIS_DOESNT_MATTER",
        };
      } else {
        if (url.pathname.startsWith("/oai2ant")) {
          return {
            ...env,
            WORKER_TYPE: "GATEWAY_API",
            GATEWAY_TARGET: "https://gateway.llmmapper.com",
          };
        }
        throw new Error("Unknown path");
      }
    } else if (hostParts[0] === "google") {
      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
        GATEWAY_TARGET: "https://generativelanguage.googleapis.com",
      };
    } else if (hostParts[0] === "llama") {
      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
        GATEWAY_TARGET: "https://api.llama.com",
      };
    } else if (hostParts[0] === "nvidia") {
      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
        GATEWAY_TARGET: "https://integrate.api.nvidia.com",
      };
    } else if (hostParts[0].includes("openrouter")) {
      if (isRootPath(url) && request.getMethod() === "GET") {
        return {
          ...env,
          WORKER_DEFINED_REDIRECT_URL: "https://openrouter.ai",
        };
      } else {
        return {
          ...env,
          WORKER_TYPE: "GATEWAY_API",
          GATEWAY_TARGET: "https://openrouter.ai",
        };
      }
    } else if (hostParts[0].includes("deepinfra")) {
      if (isRootPath(url) && request.getMethod() === "GET") {
        return {
          ...env,
          WORKER_DEFINED_REDIRECT_URL: "https://deepinfra.com",
        };
      }
      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
        GATEWAY_TARGET: "https://api.deepinfra.com",
      };
    } else if (hostParts[0].includes("groq")) {
      if (isRootPath(url) && request.getMethod() === "GET") {
        return {
          ...env,
          WORKER_DEFINED_REDIRECT_URL: "https://groq.com",
        };
      }

      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
        GATEWAY_TARGET: "https://api.groq.com",
      };
    } else if (hostParts[0] === "perplexity") {
      if (isRootPath(url) && request.getMethod() === "GET") {
        return {
          ...env,
          WORKER_DEFINED_REDIRECT_URL: "https://api.perplexity.ai",
        };
      }

      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
        GATEWAY_TARGET: "https://api.perplexity.ai",
      };
    } else if (hostParts[0].includes("hyperbolic")) {
      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
        GATEWAY_TARGET: "https://api.hyperbolic.xyz",
      };
    } else if (hostParts[0].includes("cerebras")) {
      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
        GATEWAY_TARGET: "https://api.cerebras.ai",
      };
    } else if (hostParts[0].includes("mistral")) {
      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
        GATEWAY_TARGET: "https://api.mistral.ai",
      };
    } else if (hostParts[0].includes("bedrock")) {
      request.removeBedrock();
      const region = url.pathname.split("/v1/")[1].split("/")[0];
      const forwardToHost =
        "bedrock-runtime." +
        url.pathname.split("/v1/")[1].split("/")[0] +
        ".amazonaws.com";
      const forwardToUrl =
        "https://" +
        forwardToHost +
        "/" +
        url.pathname.split("/v1/")[1].split("/").slice(1).join("/");
      await request.signAWSRequest({
        region,
        forwardToHost,
      });

      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
        GATEWAY_TARGET: forwardToUrl,
      };
    } else if (hostParts[0].includes("fireworks")) {
      if (isRootPath(url) && request.getMethod() === "GET") {
        return {
          ...env,
          WORKER_DEFINED_REDIRECT_URL: "https://fireworks.ai",
        };
      } else {
        return {
          ...env,
          WORKER_TYPE: "GATEWAY_API",
          GATEWAY_TARGET: "https://api.fireworks.ai",
        };
      }
    } else if (hostParts[0].includes("predibase")) {
      if (isRootPath(url) && request.getMethod() === "GET") {
        return {
          ...env,
          WORKER_DEFINED_REDIRECT_URL: "https://app.predibase.com",
        };
      } else {
        return {
          ...env,
          WORKER_TYPE: "GATEWAY_API",
          GATEWAY_TARGET: "https://api.app.predibase.com",
        };
      }
    } else if (hostParts[0].includes("qstash")) {
      const pathname = new URL(request.url).pathname;
      if (!pathname.startsWith("/llm")) {
        throw new Error("QStash only accepts routes that start with /llm");
      }
      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
        GATEWAY_TARGET: "https://qstash.upstash.io",
      };
    } else if (hostParts[0] === "x") {
      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
        GATEWAY_TARGET: "https://api.x.ai",
      };
    } else if (hostParts[0].includes("deepseek")) {
      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
        GATEWAY_TARGET: "https://api.deepseek.com",
      };
    } else if (hostParts[0] === "nebius") {
      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
        GATEWAY_TARGET: "https://api.studio.nebius.ai",
      };
    } else if (hostParts[0] === "novita") {
      return {
        ...env,
        WORKER_TYPE: "GATEWAY_API",
        GATEWAY_TARGET: "https://api.novita.ai",
      };
    } else if (hostParts[0].includes("firecrawl")) {
      if (isRootPath(url) && request.getMethod() === "GET") {
        return {
          ...env,
          WORKER_DEFINED_REDIRECT_URL: "https://www.firecrawl.dev/",
        };
      } else {
        if (url.pathname.includes("scrape")) {
          return {
            ...env,
            WORKER_TYPE: "GATEWAY_API",
            GATEWAY_TARGET: "https://api.firecrawl.dev/v0/scrape",
          };
        }
        if (url.pathname.includes("search")) {
          return {
            ...env,
            WORKER_TYPE: "GATEWAY_API",
            GATEWAY_TARGET: "https://api.firecrawl.dev/v0/search",
          };
        }
        return {
          ...env,
          WORKER_TYPE: "GATEWAY_API",
          GATEWAY_TARGET: "https://api.firecrawl.dev/v0/crawl",
        };
      }
    }
  }

  if (
    hostParts.length >= 3 &&
    host.includes("gateway") &&
    !host.includes("hconeai") &&
    !host.includes("helicone")
  ) {
    // if it is not a helicone.ai request, but it is a gateway request, then it is a customer gateway request
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
    console.log("WORKER_TYPE", env.WORKER_TYPE);
    try {
      const requestWrapper = await RequestWrapper.create(request, env);
      if (requestWrapper.error || !requestWrapper.data) {
        return handleError(requestWrapper.error);
      }
      env = await modifyEnvBasedOnPath(env, requestWrapper.data);

      if (env.WORKER_DEFINED_REDIRECT_URL) {
        return Response.redirect(env.WORKER_DEFINED_REDIRECT_URL, 301);
      }

      const router = buildRouter(
        env.WORKER_TYPE,
        request.url.includes("browser")
      );

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
    const supabaseClientUS = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );
    const supabaseClientEU = createClient<Database>(
      env.EU_SUPABASE_URL,
      env.EU_SUPABASE_SERVICE_ROLE_KEY
    );
    await updateLoopUsers(env);
    if (controller.cron === "0 * * * *") {
      return;
    }
    if (controller.cron === "0 10 * * mon") {
      const reportManagerUS = new ReportManager(
        new ReportStore(
          supabaseClientUS,
          new ClickhouseClientWrapper({
            CLICKHOUSE_HOST: env.CLICKHOUSE_HOST,
            CLICKHOUSE_USER: env.CLICKHOUSE_USER,
            CLICKHOUSE_PASSWORD: env.CLICKHOUSE_PASSWORD,
          })
        ),
        env
      );

      const { error: sendReportsErrUS } = await reportManagerUS.sendReports();

      if (sendReportsErrUS) {
        console.error(`Failed to check reports: ${sendReportsErrUS}`);
      }
      const reportManagerEU = new ReportManager(
        new ReportStore(
          supabaseClientEU,
          new ClickhouseClientWrapper({
            CLICKHOUSE_HOST: env.EU_CLICKHOUSE_HOST,
            CLICKHOUSE_USER: env.EU_CLICKHOUSE_USER,
            CLICKHOUSE_PASSWORD: env.EU_CLICKHOUSE_PASSWORD,
          })
        ),
        env
      );
      const { error: sendReportsErrEU } = await reportManagerEU.sendReports();

      if (sendReportsErrEU) {
        console.error(`Failed to check reports: ${sendReportsErrEU}`);
      }
      return;
    }
    if (controller.cron === "* * * * *") {
      const alertManagerUS = new AlertManager(
        new AlertStore(
          supabaseClientUS,
          new ClickhouseClientWrapper({
            CLICKHOUSE_HOST: env.CLICKHOUSE_HOST,
            CLICKHOUSE_USER: env.CLICKHOUSE_USER,
            CLICKHOUSE_PASSWORD: env.CLICKHOUSE_PASSWORD,
          })
        ),
        env
      );

      const { error: checkAlertErrUS } = await alertManagerUS.checkAlerts();

      if (checkAlertErrUS) {
        console.error(`Failed to check alerts: ${checkAlertErrUS}`);
      }

      const alertManagerEU = new AlertManager(
        new AlertStore(
          supabaseClientEU,
          new ClickhouseClientWrapper({
            CLICKHOUSE_HOST: env.EU_CLICKHOUSE_HOST,
            CLICKHOUSE_USER: env.EU_CLICKHOUSE_USER,
            CLICKHOUSE_PASSWORD: env.EU_CLICKHOUSE_PASSWORD,
          })
        ),
        env
      );

      const { error: checkAlertErrEU } = await alertManagerEU.checkAlerts();

      if (checkAlertErrEU) {
        console.error(`Failed to check alerts: ${checkAlertErrEU}`);
      }
      return;
    }
    // every 5 minutes
    if (controller.cron === "*/5 * * * *") {
      const providerKeysManagerUS = new ProviderKeysManager(
        new ProviderKeysStore(supabaseClientUS),
        env
      );

      const providerKeysManagerEU = new ProviderKeysManager(
        new ProviderKeysStore(supabaseClientEU),
        env
      );

      const apiKeysManagerUS = new APIKeysManager(
        new APIKeysStore(supabaseClientUS),
        env
      );

      const apiKeysManagerEU = new APIKeysManager(
        new APIKeysStore(supabaseClientEU),
        env
      );

      await Promise.all([
        providerKeysManagerUS.setProviderKeys(),
        providerKeysManagerEU.setProviderKeys(),
        apiKeysManagerUS.setAPIKeys(),
        apiKeysManagerEU.setAPIKeys(),
      ]);

      return;
    }
    console.error(`Unknown cron: ${controller.cron}`);
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
export { InMemoryRateLimiter, RateLimiterDO };
