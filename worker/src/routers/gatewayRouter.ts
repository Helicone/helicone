import { Provider } from "..";
import { proxyForwarder } from "../lib/HeliconeProxyRequest/ProxyForwarder";
import { RequestWrapper } from "../lib/RequestWrapper";
import { safePut } from "../lib/safePut";
import { enumerate } from "../lib/util/helpers";
import { Result, err, ok } from "../lib/util/results";
import {
  approvedDomains,
  providers,
} from "@helicone-package/cost/providers/mappings";
import { BaseRouter } from "./routerFactory";
import { EscrowInfo } from "../lib/util/aiGateway";

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
      await safePut({
        key: rateLimitKV,
        keyName: rlKey,
        value: (parseInt(count) + 1).toString(),
      });
    } else {
      const gatewayRlList = await rateLimitKV.get(`gateway-rl-list`);
      if (!gatewayRlList) {
        await safePut({
          key: rateLimitKV,
          keyName: `gateway-rl-list`,
          value: JSON.stringify([rlKey]),
          options: { expirationTtl: 365 * 24 * 60 * 60 }, // 1 year
        });
      } else {
        const list = JSON.parse(gatewayRlList);
        list.push(url);
        await safePut({
          key: rateLimitKV,
          keyName: `gateway-rl-list`,
          value: JSON.stringify(list),
          options: { expirationTtl: 365 * 24 * 60 * 60 }, // 1 year
        });
      }
      await safePut({
        key: rateLimitKV,
        keyName: rlKey,
        value: "1",
      });
    }
  }
  return {
    rateLimited: false,
  };
}

async function getProvider(
  targetBaseUrl: string | null,
  setBaseURLOverride: (url: string) => void,
  rateLimitKV: KVNamespace,
  headers: Headers
): Promise<
  Result<
    {
      provider: Provider;
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
  let provider = getProviderFromTargetUrl(targetBaseUrl);

  if (provider === "QSTASH") {
    const callback = headers.get("Upstash-Callback");

    if (callback) {
      const callbackUrl = new URL(callback);
      const targetBaseUrl = callbackUrl.origin;
      setBaseURLOverride(targetBaseUrl);
      provider = getProviderFromTargetUrl(targetBaseUrl);
    }
  }

  return ok({
    provider,
  });
}

function getProviderFromTargetUrl(targetBaseUrl: string | null): Provider {
  if (!targetBaseUrl) {
    return "CUSTOM";
  }
  const targetBaseUrlLowerCase = targetBaseUrl.toLowerCase();
  const provider = providers.find((provider) =>
    provider.pattern.test(targetBaseUrlLowerCase)
  );

  if (provider) {
    return provider.provider;
  }

  return targetBaseUrlLowerCase as Provider;
}

export const gatewayForwarder = async (
  targetProps: {
    targetBaseUrl: string | null;
    setBaseURLOverride: (url: string) => void;
    escrowInfo?: EscrowInfo;
  },
  requestWrapper: RequestWrapper,
  env: Env,
  ctx: ExecutionContext
) => {
  const { data: provderResults, error } = await getProvider(
    targetProps.targetBaseUrl,
    targetProps.setBaseURLOverride,
    env.RATE_LIMIT_KV,
    requestWrapper.headers
  );

  if (error) {
    return error;
  }

  return await proxyForwarder(
    requestWrapper,
    env,
    ctx,
    provderResults.provider,
    targetProps.escrowInfo,
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

      if (env.GATEWAY_TARGET) {
        const response = await forwarder(env.GATEWAY_TARGET);
        return response;
      }
      const fallbacks = requestWrapper.heliconeHeaders.fallBacks;

      if (fallbacks && fallbacks.length > 0) {
        return await fallBack(requestWrapper, forwarder);
      } else {
        return await forwarder(requestWrapper.heliconeHeaders.targetBaseUrl);
      }
    }
  );

  return router;
};

