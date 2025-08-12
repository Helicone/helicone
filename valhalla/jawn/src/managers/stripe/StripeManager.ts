import Stripe from "stripe";
import {
  LLMUsage,
  UpgradeToProRequest,
  UpgradeToTeamBundleRequest,
} from "../../controllers/public/stripeController";
import { clickhouseDb } from "../../lib/db/ClickhouseWrapper";
import { Database } from "../../lib/db/database.types";
import { dbExecute, dbQueryClickhouse } from "../../lib/shared/db/dbExecute";
import { buildFilterWithAuthClickHouse } from "@helicone-package/filters/filters";
import { getHeliconeAuthClient } from "../../packages/common/auth/server/AuthClientFactory";
import { AuthParams } from "../../packages/common/auth/types";
import { Result, err, ok } from "../../packages/common/result";
import { costOf } from "@helicone-package/cost";
import { BaseManager } from "../BaseManager";
import { OrganizationManager } from "../organization/OrganizationManager";
import { KVCache } from "../../lib/cache/kvCache";
import { cacheResultCustom } from "../../utils/cacheResult";
type StripeMeterEvent = Stripe.V2.Billing.MeterEventStreamCreateParams.Event;
const cache = new KVCache(60 * 1000); // 1 hour

const DEFAULT_PRODUCT_PRICES = {
  "request-volume": process.env.PRICE_PROD_REQUEST_VOLUME_ID!, //(This is just growth)
  "pro-users": process.env.PRICE_PROD_PRO_USERS_ID!,
  prompts: process.env.PRICE_PROD_PROMPTS_ID!,
  alerts: process.env.PRICE_PROD_ALERTS_ID!,
  experiments: process.env.PRICE_PROD_EXPERIMENTS_FLAT_ID!,
  evals: process.env.PRICE_PROD_EVALS_ID!,
  team_bundle: process.env.PRICE_PROD_TEAM_BUNDLE_ID!,
} as const;

const getMeterId = async (
  meterName: "stripe:trace-meter-id"
): Promise<Result<string, string>> => {
  const result = await dbExecute<{ name: string; settings: any }>(
    `SELECT * FROM helicone_settings where name = $1`,
    [meterName]
  );

  if (result.error) {
    return err(`Error fetching meter id: ${result.error}`);
  }

  if (
    !result.data?.[0]?.settings?.meterId ||
    typeof result.data?.[0]?.settings?.meterId !== "string"
  ) {
    return err("Meter id not found");
  }

  return ok(result.data[0].settings.meterId);
};

const getProProductPrices = async (): Promise<
  typeof DEFAULT_PRODUCT_PRICES
> => {
  try {
    const result = await dbExecute<{ name: string; settings: any }>(
      `SELECT * FROM helicone_settings`,
      []
    );

    if (result.error) {
      console.error("Error fetching product prices:", result.error);
      return DEFAULT_PRODUCT_PRICES;
    }

    return Object.entries(DEFAULT_PRODUCT_PRICES)
      .map(([productId, defaultPriceId]) => {
        const setting = result.data?.find(
          (setting) => setting.name === `price:${productId}`
        );
        if (setting) {
          return { [productId]: setting.settings as string };
        } else {
          if (defaultPriceId) {
            // Populate with default prices
            dbExecute(
              `INSERT INTO helicone_settings (name, settings)
             VALUES ($1, $2)
             ON CONFLICT (name) DO UPDATE SET settings = $2`,
              [`price:${productId}`, JSON.stringify(defaultPriceId)]
            );
          }
        }
        return { [productId]: defaultPriceId };
      })
      .reduce(
        (acc, curr) => ({ ...acc, ...curr }),
        {}
      ) as typeof DEFAULT_PRODUCT_PRICES;
  } catch (error) {
    console.error("Error in getProProductPrices:", error);
    return DEFAULT_PRODUCT_PRICES;
  }
};

const COST_OF_PROMPTS = 50;
const COST_OF_EVALS = 100;
const COST_OF_EXPERIMENTS = 50;

const EARLY_ADOPTER_COUPON = "9ca5IeEs"; // WlDg28Kf | prod: 9ca5IeEs

export class StripeManager extends BaseManager {
  private stripe: Stripe;

  constructor(authParams: AuthParams) {
    super(authParams);
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });
  }

  public async getCostForPrompts(): Promise<Result<number, string>> {
    const subscriptionResult = await this.getSubscription();
    const proProductPrices = await getProProductPrices();
    if (!subscriptionResult.data) {
      return ok(COST_OF_PROMPTS);
    }

    const subscription = subscriptionResult.data;

    if (
      subscription.items.data.some(
        (item) => item.price.id === proProductPrices["prompts"]
      )
    ) {
      const priceTheyArePayingForPrompts = subscription.items.data.find(
        (item) => item.price.id === proProductPrices["prompts"]
      );
      if (
        priceTheyArePayingForPrompts &&
        priceTheyArePayingForPrompts.price.unit_amount &&
        priceTheyArePayingForPrompts?.quantity &&
        priceTheyArePayingForPrompts.quantity > 0
      ) {
        return ok(priceTheyArePayingForPrompts.price.unit_amount / 100);
      }
    }

    return ok(COST_OF_PROMPTS);
  }

  public async trackStripeMeter(
    events: StripeMeterEvent[]
  ): Promise<Result<string, string>> {
    try {
      // First create a meter event session to get an auth token
      const meterEventSession =
        await this.stripe.v2.billing.meterEventSession.create();

      // Use a direct fetch to the meter events stream endpoint with the auth token
      // The endpoint is different from the standard Stripe API endpoint
      const response = await fetch(
        "https://meter-events.stripe.com/v2/billing/meter_event_stream",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${meterEventSession.authentication_token}`,
            "Content-Type": "application/json",
            "Stripe-Version": "2025-03-31.preview",
          },
          body: JSON.stringify({ events }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error response from Stripe: ${response.status} ${errorText}`
        );
      }

      return ok("Success");
    } catch (error) {
      return err(`Error tracking stripe meter: ${error}`);
    }
  }

  public async getCostForEvals(): Promise<Result<number, string>> {
    const subscriptionResult = await this.getSubscription();
    const proProductPrices = await getProProductPrices();
    if (!subscriptionResult.data) {
      return ok(COST_OF_EVALS);
    }

    const subscription = subscriptionResult.data;

    if (
      subscription.items.data.some(
        (item) => item.price.id === proProductPrices["evals"]
      )
    ) {
      const priceTheyArePayingForEvals = subscription.items.data.find(
        (item) => item.price.id === proProductPrices["evals"]
      );
      if (
        priceTheyArePayingForEvals &&
        priceTheyArePayingForEvals.price.unit_amount &&
        priceTheyArePayingForEvals?.quantity &&
        priceTheyArePayingForEvals.quantity > 0
      ) {
        return ok(priceTheyArePayingForEvals.price.unit_amount / 100);
      }
    }

    return ok(COST_OF_EVALS);
  }

  public async getCostForExperiments(): Promise<Result<number, string>> {
    const subscriptionResult = await this.getSubscription();
    const proProductPrices = await getProProductPrices();
    if (!subscriptionResult.data) {
      return ok(COST_OF_EXPERIMENTS);
    }

    const subscription = subscriptionResult.data;

    if (
      subscription.items.data.some(
        (item) => item.price.id === proProductPrices["experiments"]
      )
    ) {
      const priceTheyArePayingForExperiments = subscription.items.data.find(
        (item) => item.price.id === proProductPrices["experiments"]
      );
      if (
        priceTheyArePayingForExperiments &&
        priceTheyArePayingForExperiments.price.unit_amount &&
        priceTheyArePayingForExperiments?.quantity &&
        priceTheyArePayingForExperiments.quantity > 0
      ) {
        return ok(priceTheyArePayingForExperiments.price.unit_amount / 100);
      }
    }

    return ok(COST_OF_EXPERIMENTS);
  }

  private async getOrCreateStripeCustomer(): Promise<Result<string, string>> {
    try {
      // Try to get the organization's stripe customer ID
      const orgResult = await dbExecute<{ stripe_customer_id: string }>(
        `SELECT stripe_customer_id
         FROM organization
         WHERE id = $1
         LIMIT 1`,
        [this.authParams.organizationId]
      );

      if (orgResult.error) {
        return err(`Error fetching organization: ${orgResult.error}`);
      }

      // If organization has a stripe_customer_id, return it
      if (orgResult.data?.[0]?.stripe_customer_id) {
        return ok(orgResult.data[0].stripe_customer_id);
      }

      // Otherwise, need to create a new customer in Stripe
      // We still need to use the auth API for this specific function
      const authClient = getHeliconeAuthClient();
      const user = await authClient.getUserById(this.authParams.userId ?? "");
      if (user.error || !user.data) {
        return err("User does not exist");
      }

      if (!user.data?.email) {
        return err("User does not have an email");
      }

      // Create a new customer in Stripe
      const customer = await this.stripe.customers.create({
        email: user.data.email,
      });

      // Update the organization with the new stripe_customer_id
      const updateResult = await dbExecute(
        `UPDATE organization
         SET stripe_customer_id = $1
         WHERE id = $2`,
        [customer.id, this.authParams.organizationId]
      );

      if (updateResult.error) {
        return err(`Error updating organization: ${updateResult.error}`);
      }

      return ok(customer.id);
    } catch (error) {
      return err(`Error in getOrCreateStripeCustomer: ${error}`);
    }
  }

  public async getFreeUsage(): Promise<Result<number, string>> {
    const OneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: this.authParams.organizationId,
      argsAcc: [],
      filter: {
        left: {
          request_response_rmt: {
            request_created_at: {
              gt: OneMonthAgo,
            },
          },
        },
        operator: "and",
        right: {
          request_response_rmt: {
            request_created_at: {
              lt: new Date(),
            },
          },
        },
      },
    });

    const result = await clickhouseDb.dbQuery<{ count: number }>(
      `
SELECT count(*) as count
from request_response_rmt
WHERE (${builtFilter.filter})`,
      builtFilter.argsAcc
    );
    if (result.error) {
      return err("Error getting free usage");
    }

    return ok(
      result.data?.[0]?.count === undefined ? -1 : +result.data?.[0]?.count
    );
  }

  public async downgradeToFree(): Promise<Result<null, string>> {
    try {
      const subscriptionResult = await this.getSubscription();
      if (!subscriptionResult.data) {
        return err("No existing subscription found");
      }

      const subscription = subscriptionResult.data;

      const result = await this.stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
        cancellation_details: {
          comment: "Downgrading to free tier at the end of the billing period",
        },
      });
      console.log(result);

      return ok(null);
    } catch (error: any) {
      return err(`Error downgrading to free: ${error.message}`);
    }
  }

  public async undoCancelSubscription(): Promise<Result<null, string>> {
    try {
      const subscriptionResult = await this.getSubscription();
      if (!subscriptionResult.data) {
        return err("No existing subscription found");
      }

      const subscription = subscriptionResult.data;

      const result = await this.stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });

      return ok(null);
    } catch (error: any) {
      return err(`Error undoing cancel subscription: ${error.message}`);
    }
  }
  public async upgradeToProExistingCustomer(
    origin: string,
    body: UpgradeToProRequest
  ): Promise<Result<string, string>> {
    try {
      const customerId = await this.getOrCreateStripeCustomer();
      if (customerId.error || !customerId.data) {
        return err("Error getting or creating stripe customer");
      }

      const orgMemberCount = await this.getOrgMemberCount();
      if (orgMemberCount.error || !orgMemberCount.data) {
        return err("Error getting organization member count");
      }

      const seats = Math.max(orgMemberCount.data, body.seats ?? 1);

      const session = await this.portalLinkUpgradeToPro(
        origin,
        customerId.data,
        seats,
        body
      );

      return ok(session.data?.url!);
    } catch (error: any) {
      return err(`Error upgrading to pro: ${error.message}`);
    }
  }

  public async manageSubscriptionPaymentLink(
    origin: string
  ): Promise<Result<string, string>> {
    try {
      const subscriptionResult = await this.getSubscription();
      if (!subscriptionResult.data) {
        return err("No existing subscription found");
      }

      const subscription = subscriptionResult.data;

      const session = await this.stripe.billingPortal.sessions.create({
        customer: subscription.customer as string,
        return_url: origin,
      });

      return ok(session.url!);
    } catch (error: any) {
      return err(`Error creating payment link: ${error.message}`);
    }
  }
  private async getOrgMemberCount(): Promise<Result<number, string>> {
    const organizationManager = new OrganizationManager(this.authParams);
    return await organizationManager.getMemberCount(true);
  }

  private shouldApplyCoupon(): boolean {
    const currentDate = new Date();
    const cutoffDate = new Date("2024-10-15");
    return currentDate < cutoffDate;
  }

  private async shouldApplyWaterlooCoupon(
    customerId: string
  ): Promise<boolean> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      if (
        !customer.deleted &&
        customer.object === "customer" &&
        customer.email?.endsWith("uwaterloo.ca")
      ) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking Waterloo email:", error);
      return false;
    }
  }

  private async portalLinkUpgradeToPro(
    origin: string,
    customerId: string,
    orgMemberCount: number,
    body: UpgradeToProRequest
  ): Promise<Result<Stripe.Checkout.Session, string>> {
    const proProductPrices = await getProProductPrices();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: proProductPrices["request-volume"],
          // No quantity for usage based pricing
        },
        {
          price: proProductPrices["pro-users"],
          quantity: orgMemberCount,
        },
        ...(body?.addons?.prompts
          ? [
              {
                price: proProductPrices["prompts"],
                quantity: 1,
              },
            ]
          : []),
        ...(body?.addons?.alerts
          ? [
              {
                price: proProductPrices["alerts"],
                quantity: 1,
              },
            ]
          : []),
        ...(body?.addons?.experiments
          ? [
              {
                price: proProductPrices["experiments"],
                quantity: 1,
              },
            ]
          : []),
        ...(body?.addons?.evals
          ? [
              {
                price: proProductPrices["evals"],
                quantity: 1,
              },
            ]
          : []),
      ],
      mode: "subscription",
      metadata: {
        orgId: this.authParams.organizationId,
        tier: "pro-20250202",
      },
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          orgId: this.authParams.organizationId,
          tier: "pro-20250202",
        },
      },
      ui_mode: body.ui_mode ?? "hosted",
    };

    // Add success_url and cancel_url only if not in embedded mode
    if (body.ui_mode !== "embedded") {
      sessionParams.success_url = `${origin}/dashboard`;
      sessionParams.cancel_url = `${origin}/dashboard`;
    } else {
      sessionParams.return_url = `${origin}/onboarding/integrate`;
    }

    const isWaterlooEmail = await this.shouldApplyWaterlooCoupon(customerId);
    if (isWaterlooEmail) {
      sessionParams.discounts = [
        {
          coupon: "WATERLOO2025",
        },
      ];
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    return ok(session);
  }

  public async upgradeToProLink(
    origin: string,
    body: UpgradeToProRequest
  ): Promise<Result<string, string>> {
    try {
      const subscriptionResult = await this.getSubscription();
      if (subscriptionResult.data) {
        return err("User already has a pro subscription");
      }

      const customerId = await this.getOrCreateStripeCustomer();

      if (customerId.error || !customerId.data) {
        return err("Error getting or creating stripe customer");
      }

      const orgMemberCount = await this.getOrgMemberCount();
      if (orgMemberCount.error || !orgMemberCount.data) {
        return err("Error getting organization member count");
      }

      const seats = Math.max(orgMemberCount.data, body.seats ?? 1);
      const sessionUrl = await this.portalLinkUpgradeToPro(
        origin,
        customerId.data,
        seats,
        body
      );

      // For embedded mode, return the client secret instead of the URL
      if (body.ui_mode === "embedded") {
        return ok(sessionUrl.data?.client_secret!);
      }

      return ok(sessionUrl.data?.url!);
    } catch (error: any) {
      return err(`Error creating upgrade link: ${error.message}`);
    }
  }

  private async portalLinkUpgradeToTeamBundle(
    origin: string,
    customerId: string,
    isNewCustomer: boolean,
    uiMode: "embedded" | "hosted"
  ): Promise<Result<Stripe.Checkout.Session, string>> {
    const proProductPrices = await getProProductPrices();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: proProductPrices["request-volume"],
        },
        {
          price: proProductPrices["team_bundle"],
          quantity: 1,
        },
      ],
      mode: "subscription",
      metadata: {
        orgId: this.authParams.organizationId,
        tier: "team-20250130",
      },
      subscription_data: {
        trial_period_days: isNewCustomer ? 7 : undefined,
        metadata: {
          orgId: this.authParams.organizationId,
          tier: "team-20250130",
        },
      },
      ui_mode: uiMode,
    };

    // Add success_url and cancel_url only if not in embedded mode
    if (uiMode !== "embedded") {
      sessionParams.success_url = `${origin}/dashboard`;
      sessionParams.cancel_url = `${origin}/dashboard`;
    } else {
      sessionParams.return_url = `${origin}/onboarding/integrate`;
    }

    const isWaterlooEmail = await this.shouldApplyWaterlooCoupon(customerId);
    if (isWaterlooEmail) {
      sessionParams.discounts = [
        {
          coupon: "WATERLOO2025",
        },
      ];
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    return ok(session);
  }

  async upgradeToTeamBundleLink(
    returnUrl: string,
    body: UpgradeToTeamBundleRequest
  ): Promise<Result<string, string>> {
    try {
      const subscriptionResult = await this.getSubscription();
      if (subscriptionResult.data) {
        return err("User already has a pro subscription");
      }

      const customerId = await this.getOrCreateStripeCustomer();
      if (customerId.error || !customerId.data) {
        return err("Error getting or creating stripe customer");
      }

      const session = await this.portalLinkUpgradeToTeamBundle(
        returnUrl,
        customerId.data,
        true,
        body.ui_mode ?? "hosted"
      );

      if (body.ui_mode === "embedded") {
        return ok(session.data?.client_secret!);
      }

      return ok(session.data?.url!);
    } catch (error: any) {
      return err(`Error upgrading to team bundle: ${error.message}`);
    }
  }

  async upgradeToTeamBundleExistingCustomer(
    returnUrl: string,
    body: UpgradeToTeamBundleRequest
  ): Promise<Result<string, string>> {
    try {
      const subscriptionResult = await this.getSubscription();
      if (!subscriptionResult.data) {
        return err("No existing subscription found");
      }

      const customerId = await this.getOrCreateStripeCustomer();
      if (customerId.error || !customerId.data) {
        return err("Error getting or creating stripe customer");
      }

      const subscription = subscriptionResult.data;

      if (
        subscription.cancel_at_period_end ||
        subscription.status === "canceled"
      ) {
        const session = await this.portalLinkUpgradeToTeamBundle(
          returnUrl,
          customerId.data,
          false,
          body.ui_mode ?? "hosted"
        );

        if (body.ui_mode === "embedded") {
          return ok(session.data?.client_secret!);
        }
        return ok(session.data?.url!);
      }

      // Cancels after they pay for the new subscription
      // await this.stripe.subscriptions.update(subscription.id, {
      //   cancel_at_period_end: true,
      //   proration_behavior: "create_prorations",
      //   cancellation_details: {
      //     comment: "Upgrading to team bundle at the end of the billing period",
      //   },
      // });

      const session = await this.portalLinkUpgradeToTeamBundle(
        returnUrl,
        customerId.data,
        false,
        body.ui_mode ?? "hosted"
      );

      if (body.ui_mode === "embedded") {
        return ok(session.data?.client_secret!);
      }
      return ok(session.data?.url!);
    } catch (error: any) {
      return err(`Error upgrading to team bundle: ${error.message}`);
    }
  }

  private async getEvaluatorsUsage({
    startTime,
  }: {
    startTime: Date;
  }): Promise<Result<LLMUsage[], string>> {
    const orgId = this.authParams.organizationId;

    const query = `
    SELECT 
      model,
      provider,
      sum(prompt_tokens) as prompt_tokens,
      sum(completion_tokens) as completion_tokens,
      count(*) as total_count
    FROM request_response_rmt
    WHERE organization_id = {val_0: String}
      AND request_created_at >= {val_1: DateTime}
      AND properties['Helicone-Evaluator'] IS NOT NULL
      AND properties['Helicone-Evaluator'] != ''
      AND status >= 200
      AND status < 300
    GROUP BY model, provider
  `;

    const result = await dbQueryClickhouse<LLMUsage>(query, [orgId, startTime]);

    return ok(
      result.data
        ?.map((model) => {
          const totalCost = costOf({
            model: model.model,
            provider: model.provider.toUpperCase(),
          });

          if (!model || !totalCost) return null;

          return {
            amount:
              (totalCost.completion_token * model.completion_tokens +
                totalCost.prompt_token * model.prompt_tokens) *
              100,
            description: `${model.completion_tokens.toLocaleString()} completion tokens, ${model.prompt_tokens.toLocaleString()} prompt tokens, at $${(
              (totalCost.completion_token * 1_000_000) /
              100
            ).toPrecision(6)}/million completion tokens, $${(
              (totalCost.prompt_token * 1_000_000) /
              100
            ).toPrecision(6)}/million prompt tokens`,
            totalCost: totalCost,
            model: model.model,
            provider: model.provider,
            prompt_tokens: model.prompt_tokens,
            completion_tokens: model.completion_tokens,
            total_count: model.total_count,
          };
        })
        .filter((item): item is LLMUsage => item !== null) ?? []
    );
  }

  private async getExperimentsUsage({
    startTime,
  }: {
    startTime: Date;
  }): Promise<Result<LLMUsage[], string>> {
    const orgId = this.authParams.organizationId;

    const query = `
    SELECT 
      model,
      provider,
      sum(prompt_tokens) as prompt_tokens,
      sum(completion_tokens) as completion_tokens,
      count(*) as total_count
    FROM request_response_rmt
    WHERE organization_id = {val_0: String}
      AND request_created_at >= {val_1: DateTime}
      AND properties['Helicone-Experiment-Id'] IS NOT NULL
      AND properties['Helicone-Experiment-Id'] != ''
      AND status >= 200
      AND status < 300
    GROUP BY model, provider
  `;

    const result = await dbQueryClickhouse<LLMUsage>(query, [orgId, startTime]);

    return ok(
      result.data
        ?.map((model) => {
          const totalCost = costOf({
            model: model.model,
            provider: model.provider.toUpperCase(),
          });

          if (!model || !totalCost) return null;

          return {
            amount:
              (totalCost.completion_token * model.completion_tokens +
                totalCost.prompt_token * model.prompt_tokens) *
              100,
            description: `${model.completion_tokens.toLocaleString()} completion tokens, ${model.prompt_tokens.toLocaleString()} prompt tokens, at $${(
              (totalCost.completion_token * 1_000_000) /
              100
            ).toPrecision(6)}/million completion tokens, $${(
              (totalCost.prompt_token * 1_000_000) /
              100
            ).toPrecision(6)}/million prompt tokens`,
            totalCost: totalCost,
            model: model.model,
            provider: model.provider,
            prompt_tokens: model.prompt_tokens,
            completion_tokens: model.completion_tokens,
            total_count: model.total_count,
          };
        })
        .filter((item): item is LLMUsage => item !== null) ?? []
    );
  }

  public async getUpcomingInvoice(): Promise<
    Result<
      Stripe.Response<Stripe.UpcomingInvoice> & {
        experiments_usage: LLMUsage[];
        evaluators_usage: LLMUsage[];
      },
      string
    >
  > {
    const subscriptionResult = await this.getSubscription();
    if (!subscriptionResult.data) {
      return err("No existing subscription found");
    }

    const subscription = subscriptionResult.data;

    try {
      const upcomingInvoice = await this.stripe.invoices.retrieveUpcoming({
        customer: subscription.customer as string,
        subscription: subscription.id,
        expand: ["lines.data.price.product"],
      });

      const experimentsUsage = await this.getExperimentsUsage({
        startTime: new Date(upcomingInvoice.period_start * 1000),
      });

      const evaluatorsUsage = await this.getEvaluatorsUsage({
        startTime: new Date(upcomingInvoice.period_start * 1000),
      });

      return ok({
        ...upcomingInvoice,
        experiments_usage: experimentsUsage.data ?? [],
        evaluators_usage: evaluatorsUsage.data ?? [],
      });
    } catch (error: any) {
      return err(`Error retrieving upcoming invoice: ${error.message}`);
    }
  }

  private async addProductToStripe(
    productType: "alerts" | "prompts" | "experiments" | "evals"
  ): Promise<Result<null, string>> {
    const proProductPrices = await getProProductPrices();
    try {
      const subscriptionResult = await this.getSubscription();
      if (!subscriptionResult.data) {
        return err("No existing subscription found");
      }

      const subscription = subscriptionResult.data;
      const priceId = proProductPrices[productType];

      // Check if the product is already included in the subscription
      const existingItem = subscription.items.data.find(
        (item) => item.price.id === priceId
      );
      if (existingItem && existingItem.quantity === 0) {
        await this.stripe.subscriptions.update(subscription.id, {
          items: [
            {
              id: existingItem.id,
              quantity: 1,
            },
          ],
          proration_behavior: "create_prorations",
        });

        return ok(null);
      }

      // Add the product to the subscription
      const updatedSubscription = await this.stripe.subscriptions.update(
        subscription.id,
        {
          items: [
            ...subscription.items.data.map((item) => ({ id: item.id })),
            {
              price: priceId,
              quantity: 1,
            },
          ],
          proration_behavior: "create_prorations",
        }
      );

      console.log(
        `Subscription updated with ${productType}:`,
        updatedSubscription.id
      );

      return ok(null);
    } catch (error: any) {
      return err(
        `Error adding ${productType} to subscription: ${error.message}`
      );
    }
  }

  public async addProductToSubscription(
    productType: "alerts" | "prompts" | "experiments" | "evals"
  ): Promise<Result<null, string>> {
    const stripeAddResult = await this.addProductToStripe(productType);
    if (stripeAddResult.error) {
      return err(stripeAddResult.error);
    }

    const currentOrgStripeMetadata = await this.getStripeMetadata();
    if (currentOrgStripeMetadata.error) {
      return err(currentOrgStripeMetadata.error);
    }

    const orgData = await this.getOrganization();
    if (orgData.error) {
      return err(orgData.error);
    }

    const existingMetadata =
      (orgData.data?.stripe_metadata as Record<string, any>) || {};
    const existingAddons =
      (existingMetadata.addons as Record<string, boolean>) || {};

    await dbExecute(
      `UPDATE organization
       SET stripe_metadata = $1
       WHERE id = $2`,
      [
        JSON.stringify({
          ...existingMetadata,
          addons: {
            ...existingAddons,
            [productType]: true,
          },
        }),
        this.authParams.organizationId,
      ]
    );

    return ok(null);
  }

  private async getStripeMetadata(): Promise<Result<Stripe.Metadata, string>> {
    const subscriptionResult = await this.getSubscription();
    if (!subscriptionResult.data) {
      return err("No existing subscription found");
    }

    const subscription = subscriptionResult.data;
    return ok(subscription.metadata);
  }

  private async deleteProductFromStripe(
    productType: "alerts" | "prompts" | "experiments" | "evals"
  ): Promise<Result<null, string>> {
    const proProductPrices = await getProProductPrices();
    try {
      const subscriptionResult = await this.getSubscription();
      if (!subscriptionResult.data) {
        return err("No existing subscription found");
      }

      const subscription = subscriptionResult.data;
      const currentPriceId = proProductPrices[productType];

      // First try to find the item by the current price ID
      let itemToRemove = subscription.items.data.find(
        (item) => item.price.id === currentPriceId
      );

      // If not found by current price ID, try to find by product name/type
      if (!itemToRemove) {
        itemToRemove = subscription.items.data.find((item) => {
          const product = item.price.product as Stripe.Product;
          // Check if the product name or metadata contains the productType
          return (
            product.name.toLowerCase().includes(productType.toLowerCase()) ||
            (product.metadata && product.metadata.type === productType)
          );
        });
      }

      if (!itemToRemove) {
        console.log(`${productType.toUpperCase()} ITEM NOT FOUND`);
        return ok(null); // Product not found in subscription
      }

      // If the item is already set to quantity 0, no need to update
      if (itemToRemove.quantity !== undefined && itemToRemove.quantity === 0) {
        console.log(`${productType} is already scheduled for removal`);
        return ok(null);
      }

      const result = await this.stripe.subscriptions.update(subscription.id, {
        items: [
          {
            id: itemToRemove.id,
            quantity: 0,
          },
        ],
        proration_behavior: "create_prorations",
      });
      console.log("DELETED", result);

      console.log(
        `${productType} scheduled for removal at the end of the billing cycle`
      );

      return ok(null);
    } catch (error: any) {
      return err(
        `Error deleting ${productType} from subscription: ${error.message}`
      );
    }
  }

  public async deleteProductFromSubscription(
    productType: "alerts" | "prompts" | "experiments" | "evals"
  ): Promise<Result<null, string>> {
    const stripeDeleteResult = await this.deleteProductFromStripe(productType);
    if (stripeDeleteResult.error) {
      return err(stripeDeleteResult.error);
    }

    const orgData = await this.getOrganization();

    if (orgData.error) {
      return err("Failed to get organization data");
    }

    const existingMetadata =
      (orgData.data?.stripe_metadata as Record<string, any>) || {};
    const existingAddons =
      (existingMetadata.addons as Record<string, boolean>) || {};

    await dbExecute(
      `UPDATE organization
       SET stripe_metadata = $1
       WHERE id = $2`,
      [
        JSON.stringify({
          ...existingMetadata,
          addons: {
            ...existingAddons,
            [productType]: false,
          },
        }),
        this.authParams.organizationId,
      ]
    );

    return ok(null);
  }

  // Takes the existing subscription and adds any missing products
  public async migrateToPro(): Promise<Result<null, string>> {
    const proProductPrices = await getProProductPrices();
    try {
      const subscriptionResult = await this.getSubscription();
      if (!subscriptionResult.data) {
        return err("No existing subscription found");
      }

      const subscription = subscriptionResult.data;
      const existingProducts = subscription.items.data.map(
        (item) => item.price.id
      );

      const missingProducts = Object.values([
        proProductPrices["pro-users"],
      ]).filter((productId) => !existingProducts.includes(productId));

      if (missingProducts.length === 0) {
        return ok(null); // All pro products are already in the subscription
      }

      const updateParams: Stripe.SubscriptionUpdateParams = {
        items: missingProducts.map((productId) => ({ price: productId })),
        metadata: {
          orgId: this.authParams.organizationId,
          tier: "pro-20250202",
        },
        proration_behavior: "none",
      };

      if (this.shouldApplyCoupon()) {
        updateParams.coupon = EARLY_ADOPTER_COUPON;
      }

      await this.stripe.subscriptions.update(subscription.id, updateParams);

      // Update the organization tier
      const updateResult = await dbExecute(
        `UPDATE organization
         SET tier = $1
         WHERE id = $2`,
        ["pro-20250202", this.authParams.organizationId]
      );

      if (updateResult.error) {
        return err(`Error updating organization tier: ${updateResult.error}`);
      }

      return ok(null);
    } catch (error: any) {
      if (
        error.message.includes("is already using that Price") &&
        error.message.includes("an existing Subscription")
      ) {
        // Even if there was an error, try to update the tier
        await dbExecute(
          `UPDATE organization
           SET tier = $1
           WHERE id = $2`,
          ["pro-20250202", this.authParams.organizationId]
        );
      }
      return err(`Error migrating to pro: ${error.message}`);
    }
  }

  public async getOrganization(): Promise<
    Result<Database["public"]["Tables"]["organization"]["Row"], string>
  > {
    try {
      const result = await dbExecute<
        Database["public"]["Tables"]["organization"]["Row"]
      >(
        `SELECT *
         FROM organization
         WHERE id = $1
         LIMIT 1`,
        [this.authParams.organizationId]
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err(result.error ?? "No organization found");
      }

      return ok(result.data[0]);
    } catch (error) {
      return err(`Error fetching organization: ${error}`);
    }
  }

  public async getSubscription(): Promise<Result<Stripe.Subscription, string>> {
    try {
      const organization = await this.getOrganization();

      if (organization.error) {
        return err(organization.error);
      }

      if (!organization.data?.stripe_subscription_id) {
        return err("No subscription found for this organization");
      }

      const subscription = await this.stripe.subscriptions.retrieve(
        organization.data.stripe_subscription_id,
        {
          expand: ["items.data.price.product"],
        }
      );

      return ok(subscription);
    } catch (error: any) {
      return err(`Error retrieving subscription: ${error.message}`);
    }
  }

  public async getCreditBalance(): Promise<Result<{ balance: number }, string>> {
    try {
      const organization = await this.getOrganization();

      if (organization.error) {
        return err(organization.error);
      }

      if (!organization.data) {
        return err("Organization not found");
      }

      if (!organization.data.stripe_customer_id) {
        // No Stripe customer ID, return 0 balance
        return ok({ balance: 0 });
      }

      // Get credit balance from Stripe
      const creditBalanceSummary = await this.stripe.billing.creditBalanceSummary.retrieve({
        customer: organization.data.stripe_customer_id,
        filter: {
          type: "applicability_scope",
          applicability_scope: {
            price_type: "metered",
          },
        },
      });

      let totalBalance = 0;
      if (
        creditBalanceSummary.balances &&
        Array.isArray(creditBalanceSummary.balances)
      ) {
        for (const balance of creditBalanceSummary.balances) {
          if (
            balance.available_balance?.type === "monetary" &&
            balance.available_balance?.monetary?.currency === "usd" &&
            typeof balance.available_balance?.monetary?.value === "number"
          ) {
            totalBalance += balance.available_balance.monetary.value;
          }
        }
      }

      return ok({ balance: totalBalance });
    } catch (error: any) {
      return err(`Error retrieving credit balance: ${error.message}`);
    }
  }

  public async getCreditBalanceTransactions(params: {
    limit?: number;
    starting_after?: string;
  }): Promise<Result<Stripe.ApiList<Stripe.Billing.CreditBalanceTransaction>, string>> {
    try {
      const organization = await this.getOrganization();

      if (organization.error) {
        return err(organization.error);
      }

      if (!organization.data) {
        return err("Organization not found");
      }

      if (!organization.data.stripe_customer_id) {
        // No Stripe customer ID, return empty list
        return ok({
          object: 'list',
          data: [],
          has_more: false,
          url: '/v1/billing/credit_balance_transactions'
        } as Stripe.ApiList<Stripe.Billing.CreditBalanceTransaction>);
      }

      // Get credit balance transactions from Stripe
      const transactions = await this.stripe.billing.creditBalanceTransactions.list({
        customer: organization.data.stripe_customer_id,
        limit: params.limit,
        starting_after: params.starting_after,
      });

      return ok(transactions);
    } catch (error: any) {
      return err(`Error retrieving credit balance transactions: ${error.message}`);
    }
  }

  public async createCloudGatewayCheckoutSession(
    origin: string,
    amount: number,
  ): Promise<Result<string, string>> {
    try {
      const customerId = await this.getOrCreateStripeCustomer();
      if (customerId.error || !customerId.data) {
        return err("Error getting or creating stripe customer");
      }

      const tokenUsageProductId = process.env.STRIPE_CLOUD_GATEWAY_TOKEN_USAGE_PRODUCT;
      if (!tokenUsageProductId) {
        return err("STRIPE_CLOUD_GATEWAY_TOKEN_USAGE_PRODUCT_ID environment variable is not set");
      }

      try {
        const unitAmount = amount * 100;
        const checkoutResult = await this.stripe.checkout.sessions.create({
          customer: customerId.data,
          success_url: `${origin}/settings/credits`,
          cancel_url: `${origin}/settings/credits`,
          mode: "payment",
          line_items: [{
            price_data: {
                currency: "usd", 
                unit_amount: unitAmount,
                product: tokenUsageProductId,
            },
            quantity: 1,
          }],
          metadata: {
            orgId: this.authParams.organizationId,
            type: "cloud-gateway-tokens",
          },
        })

        if (checkoutResult.lastResponse.statusCode !== 200) {
          return err("Stripe did not return a session URL");
        }

        return ok(checkoutResult.url ?? "");
      } catch (error: any) {
        return err(`Error creating cloud gateway checkout session: ${error.message}`);
      }
    } catch (error: any) {
      return err(`Error creating cloud gateway checkout session: ${error.message}`);
    }
  }

  public async handleStripeWebhook(
    body: any,
    signature: string
  ): Promise<Result<null, string>> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      if (event.type === "invoice.created") {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice created:", invoice.id);
        // Add your logic here to process the invoice
      }

      if (event.type === "invoice.upcoming") {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
      }

      return ok(null);
    } catch (error: any) {
      return err(`Error processing webhook: ${error.message}`);
    }
  }

  public async updateProUserCount(
    count: number
  ): Promise<Result<null, string>> {
    const proProductPrices = await getProProductPrices();
    try {
      const subscriptionResult = await this.getSubscription();
      if (!subscriptionResult.data) {
        return err("No existing subscription found");
      }

      const subscription = subscriptionResult.data;
      const proUsersPriceId = proProductPrices["pro-users"];

      const proUsersItem = subscription.items.data.find(
        (item) => item.price.id === proUsersPriceId
      );

      if (!proUsersItem) {
        return err("Pro-users product not found in the subscription");
      }

      const updatedSubscription = await this.stripe.subscriptions.update(
        subscription.id,
        {
          items: [
            {
              id: proUsersItem.id,
              quantity: count,
            },
          ],
          proration_behavior: "create_prorations",
        }
      );

      console.log(
        "Pro-user count updated in subscription:",
        updatedSubscription.id
      );

      return ok(null);
    } catch (error: any) {
      return err(
        `Error updating pro-user count in subscription: ${error.message}`
      );
    }
  }

  public async getPurchasedSeatCount(): Promise<Result<number, string>> {
    try {
      const subscriptionResult = await this.getSubscription();
      if (!subscriptionResult.data) {
        return ok(0); // No subscription means 0 purchased seats
      }

      const proProductPrices = await getProProductPrices();
      const proUsersItem = subscriptionResult.data.items.data.find(
        (item) => item.price.id === proProductPrices["pro-users"]
      );

      return ok(proUsersItem?.quantity ?? 0);
    } catch (error: any) {
      return err(`Error retrieving purchased seats: ${error.message}`);
    }
  }
}
