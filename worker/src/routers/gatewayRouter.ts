import { Provider } from "..";
import { proxyForwarder } from "../lib/HeliconeProxyRequest/ProxyForwarder";
import { RequestWrapper } from "../lib/RequestWrapper";
import { enumerate } from "../lib/util/helpers";
import { Result, err, ok } from "../lib/util/results";
import {
  isApprovedApiBase,
  providers,
} from "@helicone-package/cost/providers/mappings";
import { BaseRouter } from "./routerFactory";
import { EscrowInfo } from "../lib/ai-gateway/types";
import { vaultKeyOverrideRejection } from "../lib/security/credentialPin";

function validateURL(url: string) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

async function getProvider(
  targetBaseUrl: string | null,
  setBaseURLOverride: (url: string) => void,
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
    return err(
      new Response(`Invalid target base url "${targetBaseUrl}"`, {
        status: 400,
      })
    );
  }
  const targetBaseUrlHost = new URL(targetBaseUrl).origin;

  // A path on the target is tolerated, not rejected: the AI Gateway passes
  // full endpoint URLs (".../v1/chat/completions") and some GATEWAY_TARGETs
  // carry a path (firecrawl, bedrock). buildTargetUrl only ever uses the
  // origin of the override, so the origin is what has to be authorized.
  // (This guard used to call err() without returning, so it never fired.)

  // The target must be an approved provider origin. This is an authorization
  // check, not a rate limit: the outbound request may carry a decrypted
  // provider key, so it must never be sent to a caller-chosen host.
  if (!isApprovedApiBase(targetBaseUrlHost)) {
    return err(
      new Response(
        `Target base url "${targetBaseUrlHost}" is not an approved provider domain. To request a new provider, contact engineering@helicone.ai`,
        {
          status: 403,
        }
      )
    );
  }

  setBaseURLOverride(targetBaseUrl);
  let provider = getProviderFromTargetUrl(targetBaseUrl);

  if (provider === "QSTASH") {
    const callback = headers.get("Upstash-Callback");

    if (callback) {
      if (!validateURL(callback)) {
        return err(
          new Response(`Invalid Upstash-Callback url "${callback}"`, {
            status: 400,
          })
        );
      }
      const callbackOrigin = new URL(callback).origin;
      if (!isApprovedApiBase(callbackOrigin)) {
        return err(
          new Response(
            `Upstash-Callback "${callbackOrigin}" is not an approved provider domain`,
            {
              status: 403,
            }
          )
        );
      }
      setBaseURLOverride(callbackOrigin);
      provider = getProviderFromTargetUrl(callbackOrigin);
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
    targetProps.escrowInfo
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

      // Fallbacks let the caller pick both the target and the headers. A
      // vault key must not be routed by the caller, so they are refused.
      if (
        fallbacks &&
        fallbacks.length > 0 &&
        requestWrapper.isVaultKeyRequest()
      ) {
        return vaultKeyOverrideRejection("helicone-fallbacks");
      }

      if (fallbacks && fallbacks.length > 0) {
        return await fallBack(requestWrapper, forwarder);
      } else {
        return await forwarder(requestWrapper.heliconeHeaders.targetBaseUrl);
      }
    }
  );

  return router;
};
