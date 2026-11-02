import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { StripeManager } from "../../managers/stripe/StripeManager";
import type { JawnAuthenticatedRequest } from "../../types/request";
import { isError } from "../../packages/common/result";
import express from "express";
import Stripe from "stripe";
import { hasPtbAccess } from "../../lib/billing/ptbAccess";
import { PTB_DISABLED_MESSAGE } from "../../../../../packages/common/billing/ptbAccess";
import { isJwtOrgAdmin } from "../../utils/providerKeyAccess";

export const BILLING_FORBIDDEN_MESSAGE =
  "Only organization owners and admins can change billing settings";

// Auto top-off limits (cents)
export const AUTO_TOPOFF_MIN_AMOUNT_CENTS = 500; // $5
export const AUTO_TOPOFF_MAX_AMOUNT_CENTS = 1_000_000; // $10,000
export const AUTO_TOPOFF_MAX_THRESHOLD_CENTS = 100_000; // $1,000

/**
 * Validates auto top-off settings. Returns an error message, or null if valid.
 *
 * The threshold is capped so that a single settings change cannot make the
 * worker repeatedly charge the saved card: it may not exceed the top-off
 * amount (otherwise one top-off never lifts the balance above the threshold)
 * and may not exceed $1,000.
 */
export function validateAutoTopoffSettings(body: {
  thresholdCents: unknown;
  topoffAmountCents: unknown;
}): string | null {
  const { thresholdCents, topoffAmountCents } = body;
  if (
    typeof thresholdCents !== "number" ||
    !Number.isFinite(thresholdCents) ||
    !Number.isInteger(thresholdCents)
  ) {
    return "Threshold must be a whole number of cents";
  }
  if (
    typeof topoffAmountCents !== "number" ||
    !Number.isFinite(topoffAmountCents) ||
    !Number.isInteger(topoffAmountCents)
  ) {
    return "Top-off amount must be a whole number of cents";
  }
  if (thresholdCents < 0) {
    return "Threshold must be non-negative";
  }
  if (topoffAmountCents <= 0) {
    return "Top-off amount must be positive";
  }
  if (topoffAmountCents < AUTO_TOPOFF_MIN_AMOUNT_CENTS) {
    return "Top-off amount must be at least $5";
  }
  if (topoffAmountCents > AUTO_TOPOFF_MAX_AMOUNT_CENTS) {
    return "Top-off amount must not exceed $10,000";
  }
  if (thresholdCents > AUTO_TOPOFF_MAX_THRESHOLD_CENTS) {
    return "Threshold must not exceed $1,000";
  }
  if (thresholdCents > topoffAmountCents) {
    return "Threshold must not exceed the top-off amount";
  }
  return null;
}

export interface CreateCloudGatewayCheckoutSessionRequest {
  amount: number;
  returnUrl?: string;
}

export interface CreateSetupSessionRequest {
  returnUrl?: string;
}

export enum PaymentIntentSearchKind {
  CREDIT_PURCHASES = "credit_purchases",
}

export interface SearchPaymentIntentsRequest {
  search_kind: PaymentIntentSearchKind;
  limit?: number;
  page?: string;
}

export interface PaymentIntentRecord {
  id: string; // Always the payment intent ID
  amount: number;
  created: number;
  status: string;
  isRefunded?: boolean;
  refundedAmount?: number;
  refundIds?: string[];
}

export interface StripePaymentIntentsResponse {
  data: PaymentIntentRecord[];
  has_more: boolean;
  next_page: string | null;
  count: number;
}

export interface AutoTopoffSettings {
  enabled: boolean;
  thresholdCents: number;
  topoffAmountCents: number;
  stripePaymentMethodId: string | null;
  lastTopoffAt: string | null;
  consecutiveFailures: number;
}

export interface UpdateAutoTopoffSettingsRequest {
  enabled: boolean;
  thresholdCents: number;
  topoffAmountCents: number;
  stripePaymentMethodId: string;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

export interface DailyUsageDataPoint {
  date: string; // ISO date string YYYY-MM-DD
  requests: number;
  bytes: number;
}

export interface UsageStatsResponse {
  billingPeriod: {
    start: string; // ISO date
    end: string; // ISO date
    daysElapsed: number;
    daysTotal: number;
  };
  usage: {
    totalRequests: number;
    totalBytes: number;
    totalGB: number;
  };
  dailyData: DailyUsageDataPoint[];
  estimatedCost: {
    requestsCost: number;
    gbCost: number;
    totalCost: number;
    projectedMonthlyRequestsCost: number;
    projectedMonthlyGBCost: number;
    projectedMonthlyTotalCost: number;
  };
}

export interface LLMUsage {
  model: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_count: number;
  amount: number;
  description: string;
  totalCost: {
    completion_token: number;
    prompt_token: number;
  };
}

@Route("v1/stripe")
@Tags("Stripe")
@Security("api_key")
export class StripeController extends Controller {
  /**
   * Billing changes (subscriptions, payment methods, auto top-off, credit
   * purchases) are restricted to a real user session whose org role is owner
   * or admin. Helicone API keys and org members are rejected.
   */
  private forbidden(): never {
    this.setStatus(403);
    return { error: BILLING_FORBIDDEN_MESSAGE } as never;
  }

  @Get("/subscription/free/usage")
  public async getFreeUsage(@Request() request: JawnAuthenticatedRequest) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.getFreeUsage();

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Post("/cloud/checkout-session")
  public async createCloudGatewayCheckoutSession(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body: CreateCloudGatewayCheckoutSessionRequest,
  ): Promise<{ checkoutUrl: string }> {
    if (!isJwtOrgAdmin(request.authParams)) {
      return this.forbidden();
    }

    const accessResult = await hasPtbAccess(request.authParams.organizationId);
    if (accessResult.error) {
      console.error(
        "Error checking pass-through billing access",
        accessResult.error,
      );
      this.setStatus(503);
      throw new Error("Unable to verify pass-through billing access");
    }
    if (!accessResult.data) {
      this.setStatus(403);
      throw new Error(PTB_DISABLED_MESSAGE);
    }

    const stripeManager = new StripeManager(request.authParams);
    if (body.amount < 5) {
      this.setStatus(400);
      throw new Error("Amount must be at least 5");
    }
    if (body.amount > 10000) {
      this.setStatus(400);
      throw new Error("Amount must not exceed 10000");
    }

    // Validate returnUrl to prevent open redirect attacks
    if (body.returnUrl) {
      if (!body.returnUrl.startsWith("/")) {
        this.setStatus(400);
        throw new Error("returnUrl must be a relative path starting with /");
      }
      if (body.returnUrl.includes("..")) {
        this.setStatus(400);
        throw new Error("returnUrl contains invalid characters");
      }
      // Whitelist allowed paths
      const allowedPaths = [
        "/quickstart",
        "/credits",
        "/dashboard",
        "/settings",
      ];
      if (!allowedPaths.some((path) => body.returnUrl?.startsWith(path))) {
        this.setStatus(400);
        throw new Error(
          "returnUrl must start with one of: " + allowedPaths.join(", "),
        );
      }
    }

    const result = await stripeManager.createCloudGatewayCheckoutSession(
      request.headers.origin ?? "",
      body.amount,
      body.returnUrl,
    );

    if (isError(result)) {
      console.error(
        "Error creating checkout session",
        JSON.stringify(result.error),
      );
      this.setStatus(400);
      throw new Error(result.error);
    }

    return { checkoutUrl: result.data };
  }

  @Post("/subscription/manage-subscription")
  public async manageSubscription(
    @Request() request: JawnAuthenticatedRequest,
  ) {
    if (!isJwtOrgAdmin(request.authParams)) {
      return this.forbidden();
    }

    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.manageSubscriptionPaymentLink(
      request.headers.origin ?? "",
    );

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Post("/subscription/undo-cancel-subscription")
  public async undoCancelSubscription(
    @Request() request: JawnAuthenticatedRequest,
  ) {
    if (!isJwtOrgAdmin(request.authParams)) {
      return this.forbidden();
    }

    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.undoCancelSubscription();

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Get("/subscription/preview-invoice")
  public async previewInvoice(
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<{
    currency: string | null;
    next_payment_attempt: number | null;
    lines: {
      data: {
        id: string | null;
        amount: number | null;
        description: string | null;
      }[];
    } | null;
    discount: {
      coupon: {
        name: string | null;
        percent_off: number | null;
        amount_off: number | null;
      };
    } | null;
    subtotal: number;
    tax: number | null;
    total: number;
    experiments_usage: LLMUsage[];
    evaluators_usage: LLMUsage[];
  } | null> {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.getUpcomingInvoice();

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return {
      currency: result.data?.currency ?? null,
      next_payment_attempt: result.data?.next_payment_attempt ?? null,
      lines: result.data?.lines ?? null,
      discount: result.data?.discount ?? null,
      subtotal: result.data?.subtotal ?? 0,
      tax: result.data?.tax ?? null,
      total: result.data?.total ?? 0,
      experiments_usage: result.data?.experiments_usage ?? [],
      evaluators_usage: result.data?.evaluators_usage ?? [],
    };
  }

  @Post("/subscription/cancel-subscription")
  public async cancelSubscription(
    @Request() request: JawnAuthenticatedRequest,
  ) {
    if (!isJwtOrgAdmin(request.authParams)) {
      return this.forbidden();
    }

    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.downgradeToFree();

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Get("/payment-intents/search")
  public async searchPaymentIntents(
    @Request() request: JawnAuthenticatedRequest,
    @Query() search_kind: string,
    @Query() limit?: number,
    @Query() page?: string,
  ): Promise<StripePaymentIntentsResponse> {
    // Check if search_kind is valid
    if (
      !Object.values(PaymentIntentSearchKind).includes(
        search_kind as PaymentIntentSearchKind,
      )
    ) {
      this.setStatus(400);
      throw new Error(
        `Invalid search_kind: ${search_kind}. Supported types: ${Object.values(PaymentIntentSearchKind).join(", ")}`,
      );
    }

    const searchKind = search_kind as PaymentIntentSearchKind;
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.searchPaymentIntents(
      searchKind,
      limit ?? 10,
      page,
    );

    if (isError(result)) {
      this.setStatus(500);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Get("/subscription")
  public async getSubscription(
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<{
    status: string;
    cancel_at_period_end: boolean;
    current_period_end: number;
    current_period_start: number;
    id: string;
    trial_end: number | null;
    items: {
      quantity?: number;
      price: {
        product: {
          name: string | null;
        } | null;
      };
    }[];
  } | null> {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.getSubscription();

    if (result.error) {
      // this.setStatus(400);
      console.error(result.error);
      return null;
    }

    if (!result.data) return null;

    return {
      status: result.data.status,
      cancel_at_period_end: result.data.cancel_at_period_end,
      current_period_end: result.data.current_period_end,
      current_period_start: result.data.current_period_start,
      id: result.data.id,
      trial_end: result.data.trial_end,
      items: result.data.items.data.map((item) => ({
        quantity: item.quantity,
        price: {
          product: {
            name: ((item.price.product as any)?.name ?? null) as string | null,
          },
        },
      })),
    };
  }

  @Get("/auto-topoff/settings")
  public async getAutoTopoffSettings(
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<AutoTopoffSettings | null> {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.getAutoTopoffSettings();

    if (result.error) {
      console.error(result.error);
      return null;
    }

    return result.data;
  }

  @Post("/auto-topoff/settings")
  public async updateAutoTopoffSettings(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body: UpdateAutoTopoffSettingsRequest,
  ): Promise<AutoTopoffSettings> {
    if (!isJwtOrgAdmin(request.authParams)) {
      return this.forbidden();
    }

    const validationError = validateAutoTopoffSettings(body);
    if (validationError) {
      this.setStatus(400);
      throw new Error(validationError);
    }

    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.updateAutoTopoffSettings(body);

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    if (!result.data) {
      this.setStatus(500);
      throw new Error("Failed to update auto topoff settings");
    }

    return result.data;
  }

  @Delete("/auto-topoff/settings")
  public async disableAutoTopoff(
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    if (!isJwtOrgAdmin(request.authParams)) {
      return this.forbidden();
    }

    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.disableAutoTopoff();

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return { success: true };
  }

  @Get("/payment-methods")
  public async getPaymentMethods(
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<PaymentMethod[]> {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.getPaymentMethods();

    if (result.error) {
      this.setStatus(500);
      throw new Error(result.error);
    }

    if (!result.data) {
      this.setStatus(500);
      throw new Error("Failed to fetch payment methods");
    }

    return result.data;
  }

  @Post("/payment-methods/setup-session")
  public async createSetupSession(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body: CreateSetupSessionRequest,
  ): Promise<{ setupUrl: string }> {
    if (!isJwtOrgAdmin(request.authParams)) {
      return this.forbidden();
    }

    // Validate returnUrl to prevent open redirect attacks
    if (body.returnUrl) {
      if (!body.returnUrl.startsWith("/")) {
        this.setStatus(400);
        throw new Error("returnUrl must be a relative path starting with /");
      }
      if (body.returnUrl.includes("..")) {
        this.setStatus(400);
        throw new Error("returnUrl contains invalid characters");
      }
      // Whitelist allowed paths
      const allowedPaths = ["/credits", "/settings"];
      if (!allowedPaths.some((path) => body.returnUrl?.startsWith(path))) {
        this.setStatus(400);
        throw new Error(
          "returnUrl must start with one of: " + allowedPaths.join(", "),
        );
      }
    }

    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.createSetupSession(
      request.headers.origin ?? "",
      body.returnUrl,
    );

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    if (!result.data) {
      this.setStatus(500);
      throw new Error("Failed to create setup session");
    }

    return { setupUrl: result.data };
  }

  @Delete("/payment-methods/{paymentMethodId}")
  public async removePaymentMethod(
    @Request() request: JawnAuthenticatedRequest,
    @Path() paymentMethodId: string,
  ): Promise<{ success: boolean }> {
    if (!isJwtOrgAdmin(request.authParams)) {
      return this.forbidden();
    }

    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.removePaymentMethod(paymentMethodId);

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return { success: true };
  }

  @Get("/subscription/usage-stats")
  public async getUsageStats(
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<UsageStatsResponse | null> {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.getUsageStats();

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }
}
