import { OpenAPIRouterType } from "@cloudflare/itty-router-openapi";
import { Route } from "itty-router";
import { RequestWrapper } from "../../lib/RequestWrapper";
import { InternalResponse } from "../../api/lib/internalResponse";
import { validateAdminAuth } from "./auth";
import { ProviderKey } from "../../lib/db/ProviderKeysStore";

export function getDORouter(
  router: OpenAPIRouterType<
    Route,
    [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]
  >
) {
  router.post(
    "/do/provider-keys-cache/:orgId",
    async (
      { params: { orgId } },
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      const authError = validateAdminAuth(requestWrapper, env);
      if (authError) return authError;

      if (!orgId || Array.isArray(orgId)) {
        return InternalResponse.newError(
          "orgId is required and must be a string",
          400
        );
      }

      try {
        const bodyText = await requestWrapper.unsafeGetBodyText();
        const body = JSON.parse(bodyText) as {
          providerKeys: ProviderKey[];
        };

        if (!body.providerKeys) {
          return InternalResponse.newError("Missing providerKeys", 400);
        }

        if (!env.PROVIDER_KEY_CACHE) {
          return InternalResponse.newError(
            "PROVIDER_KEY_CACHE not configured",
            500
          );
        }

        const doId = env.PROVIDER_KEY_CACHE.idFromName(orgId);
        const doStub: any = env.PROVIDER_KEY_CACHE.get(doId);
        await doStub.storeProviderKeys(orgId, body.providerKeys);

        return InternalResponse.successJSON({ success: true });
      } catch (e) {
        console.error("Error updating provider keys in DO:", e);
        return InternalResponse.newError(
          e instanceof Error ? e.message : "Internal server error",
          500
        );
      }
    }
  );

  // Invalidate a specific provider key in Durable Object cache
  router.delete(
    "/do/provider-keys-cache/:orgId/:keyCuid",
    async (
      { params: { orgId, keyCuid } },
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      const authError = validateAdminAuth(requestWrapper, env);
      if (authError) return authError;

      if (!orgId || Array.isArray(orgId)) {
        return InternalResponse.newError(
          "orgId is required and must be a string",
          400
        );
      }

      if (!keyCuid || Array.isArray(keyCuid)) {
        return InternalResponse.newError(
          "keyCuid is required and must be a string",
          400
        );
      }

      try {
        if (!env.PROVIDER_KEY_CACHE) {
          return InternalResponse.newError(
            "PROVIDER_KEY_CACHE not configured",
            500
          );
        }

        const doId = env.PROVIDER_KEY_CACHE.idFromName(orgId);
        const doStub: any = env.PROVIDER_KEY_CACHE.get(doId);
        await doStub.invalidateKey(orgId, keyCuid);

        return InternalResponse.successJSON({ success: true });
      } catch (e) {
        console.error("Error invalidating provider key in DO:", e);
        return InternalResponse.newError(
          e instanceof Error ? e.message : "Internal server error",
          500
        );
      }
    }
  );

  return router;
}
