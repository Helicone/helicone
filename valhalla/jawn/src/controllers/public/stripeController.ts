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

export interface UpgradeToProRequest {
  addons?: {
    alerts?: boolean;
    prompts?: boolean;
    experiments?: boolean;
    evals?: boolean;
  };
  seats?: number;
  ui_mode?: "embedded" | "hosted";
}

export interface UpgradeToTeamBundleRequest {
  ui_mode?: "embedded" | "hosted";
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
  @Get("/subscription/cost-for-prompts")
  public async getCostForPrompts(@Request() request: JawnAuthenticatedRequest) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.getCostForPrompts();

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Get("/subscription/cost-for-evals")
  public async getCostForEvals(@Request() request: JawnAuthenticatedRequest) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.getCostForEvals();

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Get("/subscription/cost-for-experiments")
  public async getCostForExperiments(
    @Request() request: JawnAuthenticatedRequest
  ) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.getCostForExperiments();

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
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
    @Body() body: CreateCloudGatewayCheckoutSessionRequest
  ): Promise<{ checkoutUrl: string }> {
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
      if (!body.returnUrl.startsWith('/')) {
        this.setStatus(400);
        throw new Error("returnUrl must be a relative path starting with /");
      }
      if (body.returnUrl.includes('..')) {
        this.setStatus(400);
        throw new Error("returnUrl contains invalid characters");
      }
      // Whitelist allowed paths
      const allowedPaths = ['/quickstart', '/credits', '/dashboard', '/settings'];
      if (!allowedPaths.some(path => body.returnUrl?.startsWith(path))) {
        this.setStatus(400);
        throw new Error("returnUrl must start with one of: " + allowedPaths.join(', '));
      }
    }

    const result = await stripeManager.createCloudGatewayCheckoutSession(
      request.headers.origin ?? "",
      body.amount,
      body.returnUrl,
    );

    if (isError(result)) {
      console.error("Error creating checkout session", JSON.stringify(result.error));
      this.setStatus(400);
      throw new Error(result.error);
    }

    return { checkoutUrl: result.data };
  }


  @Post("/subscription/new-customer/upgrade-to-pro")
  public async upgradeToPro(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body: UpgradeToProRequest
  ) {
    const stripeManager = new StripeManager(request.authParams);

    const clientOrigin = request.headers.origin;
    const result = await stripeManager.upgradeToProLink(
      `${clientOrigin}`,
      body
    );

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Post("/subscription/existing-customer/upgrade-to-pro")
  public async upgradeExistingCustomer(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body: UpgradeToProRequest
  ) {
    const stripeManager = new StripeManager(request.authParams);

    const result = await stripeManager.upgradeToProExistingCustomer(
      request.headers.origin ?? "",
      body
    );

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Post("/subscription/new-customer/upgrade-to-team-bundle")
  public async upgradeToTeamBundle(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body?: UpgradeToTeamBundleRequest
  ) {
    const stripeManager = new StripeManager(request.authParams);
    const clientOrigin = request.headers.origin;

    const result = await stripeManager.upgradeToTeamBundleLink(
      `${clientOrigin}`,
      body ?? {}
    );

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Post("/subscription/existing-customer/upgrade-to-team-bundle")
  public async upgradeExistingCustomerToTeamBundle(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body?: UpgradeToTeamBundleRequest
  ) {
    const stripeManager = new StripeManager(request.authParams);

    const result = await stripeManager.upgradeToTeamBundleExistingCustomer(
      request.headers.origin ?? "",
      body ?? {}
    );

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Post("/subscription/manage-subscription")
  public async manageSubscription(
    @Request() request: JawnAuthenticatedRequest
  ) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.manageSubscriptionPaymentLink(
      request.headers.origin ?? ""
    );

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Post("/subscription/undo-cancel-subscription")
  public async undoCancelSubscription(
    @Request() request: JawnAuthenticatedRequest
  ) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.undoCancelSubscription();

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Post("/subscription/add-ons/{productType}")
  public async addOns(
    @Request() request: JawnAuthenticatedRequest,
    @Path() productType: "alerts" | "prompts" | "experiments" | "evals"
  ) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.addProductToSubscription(productType);

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Delete("/subscription/add-ons/{productType}")
  public async deleteAddOns(
    @Request() request: JawnAuthenticatedRequest,
    @Path() productType: "alerts" | "prompts" | "experiments" | "evals"
  ) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.deleteProductFromSubscription(
      productType
    );

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Get("/subscription/preview-invoice")
  public async previewInvoice(
    @Request() request: JawnAuthenticatedRequest
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
    @Request() request: JawnAuthenticatedRequest
  ) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.downgradeToFree();

    if (result.error) {
      this.setStatus(400);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Post("/subscription/migrate-to-pro")
  public async migrateToPro(@Request() request: JawnAuthenticatedRequest) {
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.migrateToPro();

    if (isError(result) || !result.data) {
      console.error("Error migrating to pro", JSON.stringify(result.error || "No data returned"));
      this.setStatus(400);
      throw new Error(result.error || "Failed to migrate to pro");
    }

    return result.data;
  }

  @Get("/payment-intents/search")
  public async searchPaymentIntents(
    @Request() request: JawnAuthenticatedRequest,
    @Query() search_kind: string,
    @Query() limit?: number,
    @Query() page?: string
  ): Promise<StripePaymentIntentsResponse> {
    // Check if search_kind is valid
    if (!Object.values(PaymentIntentSearchKind).includes(search_kind as PaymentIntentSearchKind)) {
      this.setStatus(400);
      throw new Error(`Invalid search_kind: ${search_kind}. Supported types: ${Object.values(PaymentIntentSearchKind).join(", ")}`);
    }

    const searchKind = search_kind as PaymentIntentSearchKind;
    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.searchPaymentIntents(
      searchKind,
      limit ?? 10,
      page
    );

    if (isError(result)) {
      this.setStatus(500);
      throw new Error(result.error);
    }

    return result.data;
  }

  @Get("/subscription")
  public async getSubscription(
    @Request() request: JawnAuthenticatedRequest
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
    @Request() request: JawnAuthenticatedRequest
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
    @Body() body: UpdateAutoTopoffSettingsRequest
  ): Promise<AutoTopoffSettings> {
    // Validation
    if (body.thresholdCents < 0) {
      this.setStatus(400);
      throw new Error("Threshold must be non-negative");
    }
    if (body.topoffAmountCents <= 0) {
      this.setStatus(400);
      throw new Error("Top-off amount must be positive");
    }
    if (body.topoffAmountCents < 500) {
      this.setStatus(400);
      throw new Error("Top-off amount must be at least $5");
    }
    if (body.topoffAmountCents > 1000000) {
      this.setStatus(400);
      throw new Error("Top-off amount must not exceed $10,000");
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
    @Request() request: JawnAuthenticatedRequest
  ): Promise<{ success: boolean }> {
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
    @Request() request: JawnAuthenticatedRequest
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
    @Body() body: CreateSetupSessionRequest
  ): Promise<{ setupUrl: string }> {
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
          "returnUrl must start with one of: " + allowedPaths.join(", ")
        );
      }
    }

    const stripeManager = new StripeManager(request.authParams);
    const result = await stripeManager.createSetupSession(
      request.headers.origin ?? "",
      body.returnUrl
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
    @Path() paymentMethodId: string
  ): Promise<{ success: boolean }> {
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
    @Request() request: JawnAuthenticatedRequest
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
