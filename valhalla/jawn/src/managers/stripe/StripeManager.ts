import Stripe from "stripe";
import {
  LLMUsage,
  UpgradeToProRequest,
} from "../../controllers/public/stripeController";
import { clickhouseDb } from "../../lib/db/ClickhouseWrapper";
import { AuthParams, supabaseServer } from "../../lib/db/supabase";
import { dbQueryClickhouse } from "../../lib/shared/db/dbExecute";
import { buildFilterWithAuthClickHouse } from "../../lib/shared/filters/filters";
import { Result, err, ok } from "../../lib/shared/result";
import { costOf } from "../../packages/cost";
import { BaseManager } from "../BaseManager";
import { OrganizationManager } from "../organization/OrganizationManager";

const DEFAULT_PRODUCT_PRICES = {
  "request-volume": process.env.PRICE_PROD_REQUEST_VOLUME_ID!, //(This is just growth)
  "pro-users": process.env.PRICE_PROD_PRO_USERS_ID!,
  prompts: process.env.PRICE_PROD_PROMPTS_ID!,
  alerts: process.env.PRICE_PROD_ALERTS_ID!,
} as const;

const getProProductPrices = async (): Promise<
  typeof DEFAULT_PRODUCT_PRICES
> => {
  const db = await supabaseServer.client.from("helicone_settings").select("*");

  return Object.entries(DEFAULT_PRODUCT_PRICES)
    .map(([productId, defaultPriceId]) => {
      const setting = db.data?.find(
        (setting) => setting.name === `price:${productId}`
      );
      if (setting) {
        return { [productId]: setting.settings as string };
      } else {
        // Populate with default prices
        if (!db.error) {
          supabaseServer.client.from("helicone_settings").insert({
            name: `price:${productId}`,
            settings: defaultPriceId,
          });
        }
      }
      return { [productId]: defaultPriceId };
    })
    .reduce(
      (acc, curr) => ({ ...acc, ...curr }),
      {}
    ) as typeof DEFAULT_PRODUCT_PRICES;
};

const COST_OF_PROMPTS = 50;

const EARLY_ADOPTER_COUPON = "9ca5IeEs"; // WlDg28Kf | prod: 9ca5IeEs

export class StripeManager extends BaseManager {
  private stripe: Stripe;

  constructor(authParams: AuthParams) {
    super(authParams);
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-06-20",
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

  private async getOrCreateStripeCustomer(): Promise<Result<string, string>> {
    const organization = await supabaseServer.client
      .from("organization")
      .select("*")
      .eq("id", this.authParams.organizationId)
      .single();

    if (!organization.data?.stripe_customer_id) {
      const user = await supabaseServer.client.auth.admin.getUserById(
        this.authParams.userId ?? ""
      );

      console.log(user);
      if (!user.data?.user?.email) {
        return err("User does not have an email");
      }

      const customer = await this.stripe.customers.create({
        email: user.data.user.email,
      });

      const updateOrganization = await supabaseServer.client
        .from("organization")
        .update({ stripe_customer_id: customer.id })
        .eq("id", this.authParams.organizationId);

      if (updateOrganization.error) {
        return err("Error updating organization");
      }

      return ok(customer.id);
    }

    return ok(organization.data.stripe_customer_id);
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

      const sessionUrl = await this.portalLinkUpgradeToPro(
        origin,
        customerId.data,
        orgMemberCount.data,
        false,
        body
      );

      return sessionUrl;
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
    isNewCustomer: boolean,
    body: UpgradeToProRequest
  ): Promise<Result<string, string>> {
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
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard`,
      cancel_url: `${origin}/dashboard`,
      metadata: {
        orgId: this.authParams.organizationId,
        tier: "pro-20240913",
      },
      subscription_data: {
        trial_period_days: isNewCustomer ? 7 : undefined,
        metadata: {
          orgId: this.authParams.organizationId,
          tier: "pro-20240913",
        },
      },
    };

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

    return ok(session.url!);
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
      console.log("ORIGIN", origin);

      const orgMemberCount = await this.getOrgMemberCount();
      if (orgMemberCount.error || !orgMemberCount.data) {
        return err("Error getting organization member count");
      }
      const sessionUrl = await this.portalLinkUpgradeToPro(
        origin,
        customerId.data,
        orgMemberCount.data,
        true,
        body
      );

      return sessionUrl;
    } catch (error: any) {
      return err(`Error creating upgrade link: ${error.message}`);
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
    productType: "alerts" | "prompts"
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
    productType: "alerts" | "prompts"
  ): Promise<Result<null, string>> {
    const stripeAddResult = await this.addProductToStripe(productType);
    if (stripeAddResult.error) {
      return err(stripeAddResult.error);
    }

    const currentOrgStripeMetadata = await this.getStripeMetadata();
    if (currentOrgStripeMetadata.error) {
      return err(currentOrgStripeMetadata.error);
    }

    const currentMetadata = currentOrgStripeMetadata.data;

    await supabaseServer.client
      .from("organization")
      .update({
        stripe_metadata: {
          addons: {
            ...(typeof currentMetadata?.addons === "object"
              ? currentMetadata?.addons
              : {}),
            [productType]: true,
          },
        },
      })
      .eq("id", this.authParams.organizationId);

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
    productType: "alerts" | "prompts"
  ): Promise<Result<null, string>> {
    const proProductPrices = await getProProductPrices();
    try {
      const subscriptionResult = await this.getSubscription();
      if (!subscriptionResult.data) {
        return err("No existing subscription found");
      }

      const subscription = subscriptionResult.data;
      const priceId = proProductPrices[productType];

      const alertsItem = subscription.items.data.find(
        (item) => item.price.id === priceId
      );

      if (!alertsItem) {
        console.log("ALERTS ITEM NOT FOUND");
        return ok(null); // Alerts product not found in subscription
      }

      const result = await this.stripe.subscriptions.update(subscription.id, {
        items: [
          {
            id: alertsItem.id,
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
    productType: "alerts" | "prompts"
  ): Promise<Result<null, string>> {
    const stripeDeleteResult = await this.deleteProductFromStripe(productType);
    if (stripeDeleteResult.error) {
      return err(stripeDeleteResult.error);
    }

    const currentOrgStripeMetadata = await this.getStripeMetadata();
    if (currentOrgStripeMetadata.error) {
      return err(currentOrgStripeMetadata.error);
    }

    const currentMetadata = currentOrgStripeMetadata.data;

    await supabaseServer.client
      .from("organization")
      .update({
        stripe_metadata: {
          addons: {
            ...(typeof currentMetadata?.addons === "object"
              ? currentMetadata?.addons
              : {}),
            [productType]: false,
          },
        },
      })
      .eq("id", this.authParams.organizationId);

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
          tier: "pro-20240913",
        },
        proration_behavior: "none",
      };

      if (this.shouldApplyCoupon()) {
        updateParams.coupon = EARLY_ADOPTER_COUPON;
      }

      await this.stripe.subscriptions.update(subscription.id, updateParams);

      await supabaseServer.client
        .from("organization")
        .update({
          tier: "pro-20240913",
        })
        .eq("id", this.authParams.organizationId);

      return ok(null);
    } catch (error: any) {
      if (
        error.message.includes("is already using that Price") &&
        error.message.includes("an existing Subscription")
      ) {
        await supabaseServer.client
          .from("organization")
          .update({
            tier: "pro-20240913",
          })
          .eq("id", this.authParams.organizationId);
      }
      return err(`Error migrating to pro: ${error.message}`);
    }
  }

  public async getSubscription(): Promise<Result<Stripe.Subscription, string>> {
    try {
      const organization = await supabaseServer.client
        .from("organization")
        .select("*")
        .eq("id", this.authParams.organizationId)
        .single();

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

  public async reportUsageToStripe(
    customerId: string,
    usage: number
  ): Promise<Result<null, string>> {
    try {
      // Assuming you have a usage item ID for each customer
      const usageRecordParams: Stripe.SubscriptionItemCreateUsageRecordParams =
        {
          quantity: usage,
          timestamp: Math.floor(Date.now() / 1000),
          action: "set",
        };

      await this.stripe.subscriptionItems.createUsageRecord(
        "si_1234", // Replace with actual subscription item ID
        usageRecordParams
      );

      return ok(null);
    } catch (error: any) {
      return err(`Error reporting usage to Stripe: ${error.message}`);
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

        // Get usage from your system
        // You'll need to implement this method or use an appropriate service
        const usage = await this.getCustomerUsage(customerId);

        if (usage) {
          await this.reportUsageToStripe(customerId, usage);
        }
      }

      return ok(null);
    } catch (error: any) {
      return err(`Error processing webhook: ${error.message}`);
    }
  }

  private async getCustomerUsage(customerId: string): Promise<number | null> {
    // Implement this method to get the customer's usage
    // This might involve querying your database or other services
    return null;
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
}
