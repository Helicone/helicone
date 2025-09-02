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
import { checkFeatureFlag } from "../../lib/utils/featureFlags";

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
    const featureFlagResult = await checkFeatureFlag(
      request.authParams.organizationId,
      "credits"
    );
    
    if (isError(featureFlagResult)) {
      this.setStatus(500);
      throw new Error(featureFlagResult.error);
    } else if (!featureFlagResult.data) {
      this.setStatus(403);
      throw new Error("Credits feature is not enabled for this organization");
    }
    
    const stripeManager = new StripeManager(request.authParams);
    if (body.amount < 5) {
      this.setStatus(400);
      throw new Error("Amount must be at least 5");
    }
    const result = await stripeManager.createCloudGatewayCheckoutSession(
      request.headers.origin ?? "",
      body.amount,
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
}
