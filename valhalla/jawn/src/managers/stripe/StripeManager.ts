import { BaseManager } from "../BaseManager";
import { AuthParams } from "../../lib/db/supabase";
import { supabaseServer } from "../../lib/db/supabase";
import Stripe from "stripe";
import { Result, ok, err } from "../../lib/shared/result";
import { ENVIRONMENT } from "../..";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { clickhouseDb } from "../../lib/db/ClickhouseWrapper";
import { buildFilterWithAuthClickHouse } from "../../lib/shared/filters/filters";

const proProductPrices =
  ENVIRONMENT === "production"
    ? {
        "request-volume": process.env.PROD_REQUEST_VOLUME_ID!,
        "pro-users": process.env.PROD_PRO_USERS_ID!,
        prompts: process.env.PROD_PROMPTS_ID!,
        alerts: process.env.PROD_ALERTS_ID!,
      }
    : {
        // TEST PRODUCTS
        "request-volume": "price_1P0zwNFeVmeixR9wkrT3DYdi",
        "pro-users": "price_1PxwrxFeVmeixR9wUhWdnEu6",
        prompts: "price_1PyozaFeVmeixR9wqQoIV2Ur",
        alerts: "price_1PySmZFeVmeixR9wKEemD7jP",
      };

export class StripeManager extends BaseManager {
  private stripe: Stripe;

  constructor(authParams: AuthParams) {
    super(authParams);
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-06-20",
    });
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

      const getStripeCustomer = await this.stripe.customers.list({
        email: user.data?.user?.email ?? "",
      });
      console.log(getStripeCustomer);
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
SELECT count(*) 
from request_response_rmt
WHERE (${builtFilter.filter})`,
      builtFilter.argsAcc
    );
    if (result.error) {
      return err("Error getting free usage");
    }

    return ok(result.data?.[0]?.count ?? -1);
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
    origin: string
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
        false
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
    const members = await supabaseServer.client
      .from("organization_member")
      .select("*", { count: "exact" })
      .eq("organization", this.authParams.organizationId);

    if (members.error) {
      console.log(members.error);
      return err("Error getting organization members");
    }

    return ok(members.count!);
  }

  private async portalLinkUpgradeToPro(
    origin: string,
    customerId: string,
    orgMemberCount: number,
    isNewCustomer: boolean
  ): Promise<Result<string, string>> {
    const session = await this.stripe.checkout.sessions.create({
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
      ],

      mode: "subscription",
      success_url: `${origin}/dashboard`,
      cancel_url: `${origin}/dashboard`,
      metadata: {
        orgId: this.authParams.organizationId,
        tier: "pro-20240913",
      },
      subscription_data: {
        trial_period_days: isNewCustomer ? 14 : undefined,
        metadata: {
          orgId: this.authParams.organizationId,
          tier: "pro-20240913",
        },
      },
      allow_promotion_codes: true,
    });

    return ok(session.url!);
  }

  public async upgradeToProLink(
    origin: string
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
        true
      );

      return sessionUrl;
    } catch (error: any) {
      return err(`Error creating upgrade link: ${error.message}`);
    }
  }

  private async verifyProSubscriptionWithStripe(): Promise<
    Result<Stripe.Subscription, string>
  > {
    const subscriptionResult = await this.getSubscription();
    if (!subscriptionResult.data) {
      return err("No existing subscription found");
    }

    const subscription = subscriptionResult.data;

    const existingProducts = subscription.items.data.map(
      (item) => (item.price.product as Stripe.Product).id
    );

    if (!existingProducts.includes(proProductPrices["pro-users"])) {
      return err("User does not have a pro subscription");
    }

    return ok(subscription);
  }

  public async getUpcomingInvoice(): Promise<
    Result<Stripe.Response<Stripe.UpcomingInvoice>, string>
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

      return ok(upcomingInvoice);
    } catch (error: any) {
      return err(`Error retrieving upcoming invoice: ${error.message}`);
    }
  }

  private async addProductToStripe(
    productType: "alerts" | "prompts"
  ): Promise<Result<null, string>> {
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
    try {
      const subscriptionResult = await this.getSubscription();
      if (!subscriptionResult.data) {
        return err("No existing subscription found");
      }

      const subscription = subscriptionResult.data;
      const existingProducts = subscription.items.data.map(
        (item) => (item.price.product as Stripe.Product).id
      );

      const missingProducts = Object.values(proProductPrices).filter(
        (productId) => !existingProducts.includes(productId)
      );

      if (missingProducts.length === 0) {
        return ok(null); // All pro products are already in the subscription
      }

      await this.stripe.subscriptions.update(subscription.id, {
        items: missingProducts.map((productId) => ({ price: productId })),
      });

      return ok(null);
    } catch (error: any) {
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
}
