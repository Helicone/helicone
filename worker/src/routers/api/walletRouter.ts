import crypto, { timingSafeEqual } from "crypto";
import { OpenAPIRouterType } from "@cloudflare/itty-router-openapi";
import { Route } from "itty-router";
import { RequestWrapper } from "../../lib/RequestWrapper";
import { StripeManager } from "../../lib/managers/StripeManager";
import { InternalResponse } from "../../api/lib/internalResponse";
import { createAPIClient } from "../../api/lib/apiClient";

/**
 * Validates admin authentication using the manual access key.
 * Returns a Response error if authentication fails, null if successful.
 */
function validateAdminAuth(
  requestWrapper: RequestWrapper,
  env: Env
): Response | null {
  const authHeader = requestWrapper.headers.get("Authorization");
  if (!authHeader) {
    return InternalResponse.unauthorized();
  }

  const providedToken = authHeader.replace("Bearer ", "");
  const expectedToken = env.HELICONE_MANUAL_ACCESS_KEY;

  if (!expectedToken) {
    console.error("HELICONE_MANUAL_ACCESS_KEY not configured");
    return InternalResponse.newError("Server configuration error", 500);
  }

  const providedBuffer = Buffer.from(providedToken);
  const expectedBuffer = Buffer.from(expectedToken);

  // Check length first to avoid timingSafeEqual error
  if (providedBuffer.length !== expectedBuffer.length) {
    return InternalResponse.unauthorized();
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return InternalResponse.unauthorized();
  }

  return null; // Authentication successful
}

export function getWalletRouter(
  router: OpenAPIRouterType<
    Route,
    [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]
  >
) {
  // Get the current wallet state, useful for debugging.
  router.get(
    "/wallet/state",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      const client = await createAPIClient(env, _ctx, requestWrapper);
      const authParams = await client.db.getAuthParams();
      if (authParams.error !== null) {
        return client.response.unauthorized();
      }

      const orgId = authParams.data.organizationId;
      const walletId = env.WALLET.idFromName(orgId);
      const walletStub = env.WALLET.get(walletId);

      try {
        const state = await walletStub.getWalletState(orgId);
        return client.response.successJSON(state);
      } catch (e) {
        return client.response.newError(
          e instanceof Error ? e.message : "Failed to fetch credits",
          500
        );
      }
    }
  );

  // get total credits purchased
  router.get(
    "/wallet/credits/total",
    async (
      { query: { orgId } },
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      if (!orgId || Array.isArray(orgId)) {
        return InternalResponse.newError(
          "orgId is required and must be a string",
          400
        );
      }

      const authError = validateAdminAuth(requestWrapper, env);
      if (authError) return authError;

      const walletId = env.WALLET.idFromName(orgId);
      const walletStub = env.WALLET.get(walletId);

      try {
        const creditsPurchases = await walletStub.getTotalCreditsPurchased();
        return InternalResponse.successJSON(creditsPurchases);
      } catch (e) {
        return InternalResponse.newError(
          e instanceof Error
            ? e.message
            : "Failed to fetch total credits purchased",
          500
        );
      }
    }
  );

  // Admin endpoint to get wallet state for any org
  router.get(
    "/admin/wallet/:orgId/state",
    async (
      { params: { orgId } },
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      const authError = validateAdminAuth(requestWrapper, env);
      if (authError) return authError;

      const walletId = env.WALLET.idFromName(orgId);
      const walletStub = env.WALLET.get(walletId);

      try {
        const state = await walletStub.getWalletState(orgId);
        return InternalResponse.successJSON(state);
      } catch (e) {
        return InternalResponse.newError(
          e instanceof Error ? e.message : "Failed to fetch wallet state",
          500
        );
      }
    }
  );

  // Admin endpoint to get table data from wallet for any org
  router.get(
    "/admin/wallet/:orgId/tables/:tableName",
    async (
      { params: { orgId, tableName }, query: { page, pageSize } },
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      const authError = validateAdminAuth(requestWrapper, env);
      if (authError) return authError;

      // Validate table name to prevent injection
      const allowedTables = [
        "credit_purchases",
        "aggregated_debits",
        "escrows",
        "disallow_list",
        "processed_webhook_events",
      ];

      if (!allowedTables.includes(tableName)) {
        return InternalResponse.newError(
          `Invalid table name: ${tableName}`,
          400
        );
      }

      const walletId = env.WALLET.idFromName(orgId);
      const walletStub = env.WALLET.get(walletId);

      try {
        // Parse pagination parameters
        const pageNum = Math.max(0, page ? parseInt(page as string) : 0);
        const pageSizeNum = Math.min(
          Math.max(1, pageSize ? parseInt(pageSize as string) : 50),
          1000
        );

        // Get table data from the wallet durable object
        const tableDataResult: any = await walletStub.getTableData(
          tableName,
          pageNum,
          pageSizeNum
        );

        const data: any[] = Array.isArray(tableDataResult.data)
          ? tableDataResult.data
          : [];
        const total: number =
          typeof tableDataResult.total === "number" ? tableDataResult.total : 0;

        return InternalResponse.successJSON({
          tableName,
          orgId,
          page: pageNum,
          pageSize: pageSizeNum,
          data,
          total,
        });
      } catch (e) {
        console.error(`Error fetching table ${tableName} for org ${orgId}:`, e);
        return InternalResponse.newError(
          e instanceof Error ? e.message : `Failed to fetch table ${tableName}`,
          500
        );
      }
    }
  );

  // Admin endpoint to modify wallet balance for any org
  router.post(
    "/admin/wallet/:orgId/modify-balance",
    async (
      { params: { orgId } },
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      const authError = validateAdminAuth(requestWrapper, env);
      if (authError) return authError;

      // Parse request body
      const data = await requestWrapper.unsafeGetJson<{
        amount: number;
        type: "credit" | "debit";
        reason: string;
        referenceId: string;
        adminUserId: string;
      }>();

      if (!data) {
        return InternalResponse.newError("Invalid request body", 400);
      }

      // Validate inputs
      if (!data.amount || data.amount <= 0) {
        return InternalResponse.newError(
          "Amount must be a positive number",
          400
        );
      }

      if (!data.type || (data.type !== "credit" && data.type !== "debit")) {
        return InternalResponse.newError(
          "Type must be 'credit' or 'debit'",
          400
        );
      }

      if (!data.reason || data.reason.trim().length === 0) {
        return InternalResponse.newError("Reason is required", 400);
      }

      if (!data.referenceId) {
        return InternalResponse.newError("Reference ID is required", 400);
      }

      const walletId = env.WALLET.idFromName(orgId);
      const walletStub = env.WALLET.get(walletId);

      try {
        // Modify the wallet balance
        if (data.type === "credit") {
          // Add credits
          await walletStub.addCredits(data.amount, data.referenceId);
        } else {
          // Deduct credits (similar to refund)
          const deductResult = await walletStub.deductCredits(
            data.amount,
            data.referenceId,
            orgId
          );

          if (deductResult.error) {
            return InternalResponse.newError(deductResult.error, 400);
          }
        }

        // Get updated wallet state
        const walletState = await walletStub.getWalletState(orgId);

        // Log the modification for audit trail
        console.log(
          `Admin wallet modification: orgId=${orgId}, type=${data.type}, amount=${data.amount}, reason=${data.reason}, adminUserId=${data.adminUserId}`
        );

        return InternalResponse.successJSON(walletState);
      } catch (e) {
        console.error(`Error modifying wallet balance for org ${orgId}:`, e);
        return InternalResponse.newError(
          e instanceof Error ? e.message : "Failed to modify wallet balance",
          500
        );
      }
    }
  );

  // Admin endpoint to remove entry from disallow list
  router.delete(
    "/admin/wallet/:orgId/disallow-list",
    async (
      { params: { orgId } },
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      const authError = validateAdminAuth(requestWrapper, env);
      if (authError) return authError;

      // Parse request body
      const data = await requestWrapper.unsafeGetJson<{
        provider: string;
        model: string;
      }>();

      if (!data || !data.provider || !data.model) {
        return InternalResponse.newError(
          "Provider and model are required",
          400
        );
      }

      const walletId = env.WALLET.idFromName(orgId);
      const walletStub = env.WALLET.get(walletId);

      try {
        walletStub.removeFromDisallowList(data.provider, data.model);

        // Get updated wallet state to return
        const walletState = await walletStub.getWalletState(orgId);

        console.log(
          `Removed from disallow list: orgId=${orgId}, provider=${data.provider}, model=${data.model}`
        );

        return InternalResponse.successJSON(walletState);
      } catch (e) {
        console.error(`Error removing from disallow list for org ${orgId}:`, e);
        return InternalResponse.newError(
          e instanceof Error ? e.message : "Failed to remove from disallow list",
          500
        );
      }
    }
  );

  // Stripe Webhook Handler
  router.post(
    "/stripe/webhook",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      _ctx: ExecutionContext
    ) => {
      if (!env.STRIPE_WEBHOOK_SECRET) {
        console.error("STRIPE_WEBHOOK_SECRET not configured");
        return new Response("Webhook endpoint not configured", { status: 500 });
      }

      const signature = requestWrapper.headers.get("stripe-signature");
      if (!signature) {
        return new Response("Missing stripe-signature header", { status: 400 });
      }

      const body = await requestWrapper.requestBodyBuffer.unsafeGetRawText();
      if (!body) {
        return new Response("Missing request body", { status: 400 });
      }

      const webhookManager = new StripeManager(
        env.STRIPE_WEBHOOK_SECRET,
        env.STRIPE_SECRET_KEY,
        env.WALLET,
        env
      );

      const { data, error: verifyError } =
        await webhookManager.verifyAndConstructEvent(body, signature);

      if (verifyError || !data) {
        console.error("Webhook verification failed:", verifyError);
        return new Response(verifyError || "Invalid webhook", { status: 400 });
      }

      const { error: handleError } = await webhookManager.handleEvent(data);

      if (handleError) {
        console.error("Error handling webhook event:", handleError);

        // Check if error is related to insufficient balance (refund exceeds effective balance)
        if (handleError.includes("Refund amount exceeds effective balance")) {
          return new Response(handleError, { status: 400 });
        }

        return new Response("", { status: 500 });
      }

      return new Response("", { status: 200 });
    }
  );
}
