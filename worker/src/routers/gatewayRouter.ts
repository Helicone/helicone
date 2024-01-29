import { Env } from "..";
import { enumerate } from "../helpers";
import { proxyForwarder } from "../lib/HeliconeProxyRequest/forwarder";
import { RequestWrapper } from "../lib/RequestWrapper";
import { approvedDomains } from "../lib/gateway/approvedDomains";
import { Result, err, ok } from "../results";
import { BaseRouter } from "./routerFactory";

function validateURL(url: string) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

function isApprovedDomain(url: string) {
  return approvedDomains.some((domain) => domain.test(url));
}

// Only allow 10,000 requests per day per unapproved domain
async function rateLimitUnapprovedDomains(
  url: string,
  rateLimitKV: KVNamespace
): Promise<{
  rateLimited: boolean;
}> {
  if (!isApprovedDomain(url)) {
    const MAX_REQUESTS_PER_DAY = 10_000;
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const rlKey = `gateway-rl-${url}-${today}`;
    const count = await rateLimitKV.get(rlKey);
    if (count && parseInt(count) > MAX_REQUESTS_PER_DAY) {
      return {
        rateLimited: true,
      };
    } else if (count) {
      await rateLimitKV.put(rlKey, (parseInt(count) + 1).toString());
    } else {
      const gatewayRlList = await rateLimitKV.get(`gateway-rl-list`);
      if (!gatewayRlList) {
        await rateLimitKV.put(`gateway-rl-list`, JSON.stringify([rlKey]), {
          expirationTtl: 365 * 24 * 60 * 60, // 1 year
        });
      } else {
        const list = JSON.parse(gatewayRlList);
        list.push(url);
        await rateLimitKV.put(`gateway-rl-list`, JSON.stringify(list), {
          expirationTtl: 365 * 24 * 60 * 60, // 1 year
        });
        await rateLimitKV.put(rlKey, "1");
      }
    }
  }
  return {
    rateLimited: false,
  };
}

async function getProvider(
  targetBaseUrl: string | null,
  setBaseURLOverride: (url: string) => void,
  rateLimitKV: KVNamespace
): Promise<
  Result<
    {
      provider: string;
    },
    Response
  >
> {
  if (!targetBaseUrl) {
    return err(
      new Response("Missing target base url", {
        status: 400,
      })
    );
  }
  if (!validateURL(targetBaseUrl)) {
    err(
      new Response(`Invalid target base url "${targetBaseUrl}"`, {
        status: 400,
      })
    );
  }
  const targetBaseUrlHost = new URL(targetBaseUrl).origin;

  if (targetBaseUrlHost !== targetBaseUrl) {
    err(
      new Response(
        `Target base url "${targetBaseUrl}" must not contain a path, got "${targetBaseUrlHost}"`,
        {
          status: 400,
        }
      )
    );
  }
  const { rateLimited } = await rateLimitUnapprovedDomains(
    targetBaseUrlHost,
    rateLimitKV
  );
  if (rateLimited) {
    err(
      new Response(
        `Rate limited unapproved domain! To get your target-url on the list of approved domains to surpase the rate limit please reach out to us at engineering@helicone.ai`,
        {
          status: 429,
        }
      )
    );
  }

  setBaseURLOverride(targetBaseUrl);

  const targetBaseUrlLowerCase = targetBaseUrl.toLowerCase();

  let provider;
  if (
    targetBaseUrlLowerCase.includes("azure") ||
    targetBaseUrlLowerCase.includes("openai")
  ) {
    provider = "OPENAI";
  } else if (targetBaseUrlLowerCase.includes("googleapis")) {
    provider = "GOOGLE";
  } else {
    provider = targetBaseUrlHost ?? "CUSTOM";
  }
  return ok({
    provider,
  });
}

const gatewayForwarder = async (
  targetProps: {
    targetBaseUrl: string | null;
    setBaseURLOverride: (url: string) => void;
  },
  requestWrapper: RequestWrapper,
  env: Env,
  ctx: ExecutionContext
) => {
  const { data: provderResults, error } = await getProvider(
    targetProps.targetBaseUrl,
    targetProps.setBaseURLOverride,
    env.RATE_LIMIT_KV
  );

  if (error) {
    return error;
  }

  return await proxyForwarder(
    requestWrapper,
    env,
    ctx,
    provderResults.provider
  );
};

const fallBack = async (
  requestWrapper: RequestWrapper,
  forwarder: (targetBaseUrl: string | null) => Promise<Response>
) => {
  const fallbacks = requestWrapper.heliconeHeaders.fallBacks;
  if (!fallbacks) {
    throw new Error("No fallbacks");
  }
  for (const [i, fallback] of enumerate(fallbacks)) {
    const {
      "target-url": targetBaseUrl,
      headers,
      onCodes,
      bodyKeyOverride,
    } = fallback;
    const remappedHeaders = new Headers();
    for (const [key, value] of Object.entries(headers)) {
      remappedHeaders.set(key, value);
    }
    requestWrapper.remapHeaders(remappedHeaders);
    if (bodyKeyOverride) {
      requestWrapper.setBodyKeyOverride(bodyKeyOverride);
    }

    const response = await forwarder(targetBaseUrl);
    if (
      onCodes.find((code) => {
        if (typeof code === "number") {
          return code === response.status;
        } else {
          return response.status >= code.from && response.status <= code.to;
        }
      }) &&
      i !== fallbacks.length - 1
    ) {
      console.log(targetBaseUrl, "failed, trying next fallback");
    } else {
      response.headers.set("helicone-fallback-index", i.toString());
      return response;
    }
  }
};

export const getGatewayAPIRouter = (router: BaseRouter) => {
  // proxy forwarder only
  router.all(
    "*",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      function forwarder(targetBaseUrl: string | null) {
        return gatewayForwarder(
          {
            targetBaseUrl,
            setBaseURLOverride: (url) => {
              requestWrapper.setBaseURLOverride(url);
            },
          },
          requestWrapper,
          env,
          ctx
        );
      }
      const fallbacks = requestWrapper.heliconeHeaders.fallBacks;

      if (fallbacks && fallbacks.length > 0) {
        console.log("Trying fallbacks");
        return await fallBack(requestWrapper, forwarder);
      } else {
        console.log("Just forwarding");
        return await forwarder(requestWrapper.heliconeHeaders.targetBaseUrl);
      }
    }
  );

  return router;
};
