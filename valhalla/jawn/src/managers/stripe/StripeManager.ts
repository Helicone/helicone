import Stripe from "stripe";
import {
  LLMUsage,
  UpgradeToProRequest,
  UpgradeToTeamBundleRequest,
  StripePaymentIntentsResponse,
  PaymentIntentSearchKind,
  PaymentIntentRecord,
  AutoTopoffSettings,
  UpdateAutoTopoffSettingsRequest,
  PaymentMethod,
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
import { SecretManager } from "@helicone-package/secrets/SecretManager";
import { OrganizationManager } from "../organization/OrganizationManager";
import { SettingsManager } from "../../utils/settings";
import { subdivide } from "../../utils/subdivide";
import { sendMeteredBatch } from "./sendBatchEvent";

type StripeMeterEvent = Stripe.V2.Billing.MeterEventStreamCreateParams.Event;

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
    this.stripe = new Stripe(SecretManager.getSecret("STRIPE_SECRET_KEY")!, {
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
      await sendMeteredBatch(events, meterEventSession.authentication_token);

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
      const customerIdResult = await this.getOrCreateStripeCustomer();
      if (customerIdResult.error || !customerIdResult.data) {
        return err(`Error getting customer: ${customerIdResult.error}`);
      }

      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerIdResult.data,
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

  public async createCloudGatewayCheckoutSession(
    origin: string,
    amount: number,
    returnUrl?: string
  ): Promise<Result<string, string>> {
    try {
      const customerId = await this.getOrCreateStripeCustomer();
      if (customerId.error || !customerId.data) {
        return err("Error getting or creating stripe customer");
      }

      const settingsManager = new SettingsManager();
      const stripeProductSettings =
        await settingsManager.getSetting("stripe:products");
      if (
        !stripeProductSettings ||
        !stripeProductSettings.cloudGatewayTokenUsageProduct
      ) {
        return err("stripe:products setting is not configured");
      }
      const tokenUsageProductId =
        stripeProductSettings.cloudGatewayTokenUsageProduct;

      try {
        const creditsAmountCents = Math.round(amount * 100);
        const PERCENT_FEE_RATE = 0.03;
        const FIXED_FEE_CENTS = 30;
        const percentageFeeCents = Math.ceil(
          creditsAmountCents * PERCENT_FEE_RATE
        );
        const stripeFeeCents = percentageFeeCents + FIXED_FEE_CENTS;
        const totalAmountCents = creditsAmountCents + stripeFeeCents;

        const successUrl = returnUrl
          ? `${origin}${returnUrl}`
          : `${origin}/credits`;
        const cancelUrl = returnUrl
          ? `${origin}${returnUrl}`
          : `${origin}/credits`;

        const checkoutResult = await this.stripe.checkout.sessions.create({
          customer: customerId.data,
          success_url: successUrl,
          cancel_url: cancelUrl,
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: creditsAmountCents,
                product: tokenUsageProductId,
              },
              quantity: 1,
            },
            {
              price_data: {
                currency: "usd",
                unit_amount: stripeFeeCents,
                product_data: {
                  name: "Stripe fee",
                },
              },
              quantity: 1,
            },
          ],
          payment_intent_data: {
            metadata: {
              orgId: this.authParams.organizationId,
              productId: tokenUsageProductId,
              creditsAmountCents: creditsAmountCents.toString(),
              stripeFeeCents: stripeFeeCents.toString(),
              totalAmountCents: totalAmountCents.toString(),
            },
          },
        });

        if (checkoutResult.lastResponse.statusCode !== 200) {
          return err(
            `Got status code ${checkoutResult.lastResponse.statusCode} from Stripe`
          );
        } else if (!checkoutResult.url) {
          return err("Stripe did not return a session URL");
        }

        return ok(checkoutResult.url);
      } catch (error: any) {
        return err(
          `Error creating cloud gateway checkout session: ${error.message}`
        );
      }
    } catch (error: any) {
      return err(
        `Error creating cloud gateway checkout session: ${error.message}`
      );
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

  public async searchPaymentIntents(
    searchKind: PaymentIntentSearchKind,
    limit: number = 10,
    page?: string
  ): Promise<Result<StripePaymentIntentsResponse, string>> {
    try {
      let query: string;

      // Build query based on search kind
      switch (searchKind) {
        case PaymentIntentSearchKind.CREDIT_PURCHASES:
          const settingsManager = new SettingsManager();
          const stripeProductSettings =
            await settingsManager.getSetting("stripe:products");
          const productId =
            stripeProductSettings?.cloudGatewayTokenUsageProduct ??
            process.env.STRIPE_CLOUD_GATEWAY_TOKEN_USAGE_PRODUCT;
          if (!productId) {
            console.error(
              "[Stripe API] STRIPE_CLOUD_GATEWAY_TOKEN_USAGE_PRODUCT not configured"
            );
            return err("Stripe product ID not configured");
          }

          query = `metadata['productId']:'${productId}' AND metadata['orgId']:'${this.authParams.organizationId}'`;
          break;

        default:
          return err(`Unsupported search kind: ${searchKind}`);
      }

      // Search payment intents using Stripe API
      const searchParams: any = {
        query,
        limit,
      };

      // Add page parameter if provided (Stripe uses page token for search pagination)
      if (page) {
        searchParams.page = page;
      }

      const paymentIntents =
        await this.stripe.paymentIntents.search(searchParams);

      // Map Stripe PaymentIntent to our custom PaymentIntentRecord type
      const mappedData: PaymentIntentRecord[] = [];

      // Process each payment intent and fetch its refunds
      for (const intent of paymentIntents.data) {
        let totalRefunded = 0;
        let isFullyRefunded = false;
        let latestRefundDate = intent.created;
        let refundIds: string[] = [];

        // Fetch refunds for this payment intent
        try {
          const refunds = await this.stripe.refunds.list({
            payment_intent: intent.id,
            limit: 100, // Get all refunds for this payment intent
          });

          if (refunds.data.length > 0) {
            totalRefunded = refunds.data.reduce(
              (sum, refund) => sum + refund.amount,
              0
            );
            isFullyRefunded = totalRefunded >= intent.amount;
            refundIds = refunds.data.map((refund) => refund.id);

            // Use the latest refund date for sorting if fully refunded
            if (isFullyRefunded) {
              latestRefundDate = Math.max(
                ...refunds.data.map((r) => r.created),
                intent.created
              );
            }
          }
        } catch (refundError) {
          console.error(
            `Error fetching refunds for payment intent ${intent.id}:`,
            refundError
          );
          // Continue processing other payment intents even if one fails
        }

        // Add consolidated record
        if (isFullyRefunded) {
          // Show as fully refunded transaction
          mappedData.push({
            id: intent.id, // Always use payment intent ID
            amount: intent.amount,
            created: latestRefundDate,
            status: "refunded",
            isRefunded: true,
            refundedAmount: totalRefunded,
            refundIds: refundIds,
          });
        } else if (totalRefunded > 0) {
          // Show as partially refunded transaction
          mappedData.push({
            id: intent.id, // Always use payment intent ID
            amount: intent.amount,
            created: intent.created,
            status: intent.status,
            isRefunded: true,
            refundedAmount: totalRefunded,
            refundIds: refundIds,
          });
        } else {
          // Show as normal transaction
          mappedData.push({
            id: intent.id, // Always use payment intent ID
            amount: intent.amount,
            created: intent.created,
            status: intent.status,
            isRefunded: false,
          });
        }
      }

      // Sort all records by created date (newest first)
      mappedData.sort((a, b) => b.created - a.created);

      return ok({
        data: mappedData,
        has_more: paymentIntents.has_more,
        next_page: paymentIntents.next_page || null,
        count: mappedData.length,
      });
    } catch (error: any) {
      console.error("Error searching payment intents:", error);
      return err("Failed to search payment intents");
    }
  }

  async getAutoTopoffSettings(): Promise<
    Result<AutoTopoffSettings | null, string>
  > {
    try {
      const org = await this.getOrganization();
      if (org.error || !org.data) {
        return err("Failed to get organization");
      }

      const result = await dbExecute<
        Database["public"]["Tables"]["organization_auto_topoff"]["Row"]
      >(`SELECT * FROM organization_auto_topoff WHERE organization_id = $1`, [
        org.data.id,
      ]);

      if (result.error) {
        return err(`Error fetching auto topoff settings: ${result.error}`);
      }

      if (!result.data || result.data.length === 0) {
        return ok(null);
      }

      const data = result.data[0];

      return ok({
        enabled: data.enabled,
        thresholdCents: Number(data.threshold_cents),
        topoffAmountCents: Number(data.topoff_amount_cents),
        stripePaymentMethodId: data.stripe_payment_method_id,
        lastTopoffAt: data.last_topoff_at,
        consecutiveFailures: data.consecutive_failures,
      });
    } catch (error) {
      return err(`Error fetching auto topoff settings: ${error}`);
    }
  }

  async updateAutoTopoffSettings(
    settings: UpdateAutoTopoffSettingsRequest
  ): Promise<Result<AutoTopoffSettings, string>> {
    try {
      const org = await this.getOrganization();
      if (org.error || !org.data) {
        return err("Failed to get organization");
      }

      // Verify payment method exists and belongs to customer
      if (org.data.stripe_customer_id) {
        try {
          const paymentMethod = await this.stripe.paymentMethods.retrieve(
            settings.stripePaymentMethodId
          );

          // Validate payment method belongs to this organization's customer
          if (paymentMethod.customer !== org.data.stripe_customer_id) {
            return err("Payment method does not belong to this organization");
          }
        } catch (error) {
          return err("Invalid payment method");
        }
      } else {
        return err("Organization does not have a Stripe customer");
      }

      const upsertResult = await dbExecute<
        Database["public"]["Tables"]["organization_auto_topoff"]["Row"]
      >(
        `INSERT INTO organization_auto_topoff
          (organization_id, enabled, threshold_cents, topoff_amount_cents, stripe_payment_method_id, consecutive_failures)
         VALUES ($1, $2, $3, $4, $5, 0)
         ON CONFLICT (organization_id)
         DO UPDATE SET
           enabled = $2,
           threshold_cents = $3,
           topoff_amount_cents = $4,
           stripe_payment_method_id = $5,
           consecutive_failures = 0,
           updated_at = NOW()
         RETURNING *`,
        [
          org.data.id,
          settings.enabled,
          settings.thresholdCents,
          settings.topoffAmountCents,
          settings.stripePaymentMethodId,
        ]
      );

      if (
        upsertResult.error ||
        !upsertResult.data ||
        upsertResult.data.length === 0
      ) {
        return err(
          `Error updating auto topoff settings: ${upsertResult.error}`
        );
      }

      const data = upsertResult.data[0];

      return ok({
        enabled: data.enabled,
        thresholdCents: Number(data.threshold_cents),
        topoffAmountCents: Number(data.topoff_amount_cents),
        stripePaymentMethodId: data.stripe_payment_method_id,
        lastTopoffAt: data.last_topoff_at,
        consecutiveFailures: data.consecutive_failures,
      });
    } catch (error) {
      return err(`Error updating auto topoff settings: ${error}`);
    }
  }

  async disableAutoTopoff(): Promise<Result<void, string>> {
    try {
      const org = await this.getOrganization();
      if (org.error || !org.data) {
        return err("Failed to get organization");
      }

      const result = await dbExecute(
        `UPDATE organization_auto_topoff SET enabled = false WHERE organization_id = $1`,
        [org.data.id]
      );

      if (result.error) {
        return err(`Error disabling auto topoff: ${result.error}`);
      }

      return ok(undefined);
    } catch (error) {
      return err(`Error disabling auto topoff: ${error}`);
    }
  }

  async getPaymentMethods(): Promise<Result<PaymentMethod[], string>> {
    try {
      const org = await this.getOrganization();
      if (org.error || !org.data) {
        return err("Failed to get organization");
      }

      if (!org.data.stripe_customer_id) {
        return ok([]);
      }

      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: org.data.stripe_customer_id,
        type: "card",
      });

      return ok(
        paymentMethods.data.map((pm) => ({
          id: pm.id,
          brand: pm.card?.brand || "unknown",
          last4: pm.card?.last4 || "****",
          exp_month: pm.card?.exp_month || 0,
          exp_year: pm.card?.exp_year || 0,
        }))
      );
    } catch (error) {
      return err(`Error fetching payment methods: ${error}`);
    }
  }

  async createSetupSession(
    origin: string,
    returnUrl?: string
  ): Promise<Result<string, string>> {
    try {
      const customerIdResult = await this.getOrCreateStripeCustomer();
      const userEmail = await dbExecute<{ email: string }>(
        `SELECT email FROM auth.users where id = $1 LIMIT 1`,
        [this.authParams.userId]
      );

      if (customerIdResult.error || !customerIdResult.data) {
        return err(
          `Failed to get or create Stripe customer: ${customerIdResult.error}`
        );
      }
      const customerId = customerIdResult.data;

      const successUrl = returnUrl
        ? `${origin}${returnUrl}?setup=success`
        : `${origin}/credits?setup=success`;
      const cancelUrl = returnUrl
        ? `${origin}${returnUrl}?setup=cancelled`
        : `${origin}/credits?setup=cancelled`;

      const session = await this.stripe.checkout.sessions.create({
        mode: "setup",
        customer: customerId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_method_types: ["card"],
      });

      if (!session.url) {
        return err("Failed to create setup session URL");
      }

      return ok(session.url);
    } catch (error) {
      return err(`Error creating setup session: ${error}`);
    }
  }

  async removePaymentMethod(
    paymentMethodId: string
  ): Promise<Result<void, string>> {
    try {
      const org = await this.getOrganization();
      if (org.error || !org.data) {
        return err("Failed to get organization");
      }

      if (!org.data.stripe_customer_id) {
        return err("Organization does not have a Stripe customer");
      }

      // Verify the payment method belongs to this customer
      const paymentMethod =
        await this.stripe.paymentMethods.retrieve(paymentMethodId);

      if (paymentMethod.customer !== org.data.stripe_customer_id) {
        return err("Payment method does not belong to this customer");
      }

      // Detach the payment method
      await this.stripe.paymentMethods.detach(paymentMethodId);

      return ok(undefined);
    } catch (error) {
      return err(`Error removing payment method: ${error}`);
    }
  }
}
