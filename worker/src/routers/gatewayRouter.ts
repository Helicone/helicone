import { Env } from "..";
import { proxyForwarder } from "../lib/HeliconeProxyRequest/forwarder";
import { RequestWrapper } from "../lib/RequestWrapper";
import { approvedDomains } from "../lib/gateway/approvedDomains";
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
      const targetBaseUrl = requestWrapper.heliconeHeaders.targetBaseUrl;
      if (!targetBaseUrl) {
        return new Response("Missing target base url", {
          status: 400,
        });
      }
      if (!validateURL(targetBaseUrl)) {
        return new Response(`Invalid target base url "${targetBaseUrl}"`, {
          status: 400,
        });
      }
      const targetBaseUrlHost = new URL(targetBaseUrl).origin;

      if (targetBaseUrlHost !== targetBaseUrl) {
        return new Response(
          `Target base url "${targetBaseUrl}" must not contain a path, got "${targetBaseUrlHost}"`,
          {
            status: 400,
          }
        );
      }
      const { rateLimited } = await rateLimitUnapprovedDomains(
        targetBaseUrlHost,
        env.RATE_LIMIT_KV
      );
      if (rateLimited) {
        return new Response(
          `Rate limited unapproved domain! To get your target-url on the list of approved domains to surpase the rate limit please reach out to us at engineering@helicone.ai`,
          {
            status: 429,
          }
        );
      }
      console.log("targetBaseUrl", targetBaseUrl);
      requestWrapper.setBaseURLOverride(targetBaseUrl);

      const provider = targetBaseUrlHost ?? "CUSTOM";
      return await proxyForwarder(requestWrapper, env, ctx, provider);
    }
  );

  return router;
};
