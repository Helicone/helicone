import { BaseManager } from "../BaseManager";
import { AuthParams } from "../../lib/db/supabase";
import { supabaseServer } from "../../lib/db/supabase";
import Stripe from "stripe";
import { Result, ok, err } from "../../lib/shared/result";
import { ENVIRONMENT } from "../..";
import { dbExecute } from "../../lib/shared/db/dbExecute";

const proProducts =
  ENVIRONMENT === "production"
    ? {
        "request-volume": process.env.PROD_REQUEST_VOLUME_ID!,
        "pro-users": process.env.PROD_PRO_USERS_ID!,
        prompts: process.env.PROD_PROMPTS_ID!,
        alerts: process.env.PROD_ALERTS_ID!,
      }
    : {
        // TEST PRODUCTS
        "request-volume": "price_1PLYSLFeVmeixR9wXRA9cX3c",
        "pro-users": "prod_Qpc6JzriahM4BN",
        prompts: "prod_QpH7PdPlTdjNcy",
        alerts: "prod_Qq94rgfIC3mw1m",
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

  // Returns a link to upgrade to pro
  // If the user is already on pro, returns an error
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

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId.data,
        payment_method_types: ["card"],
        line_items: [
          {
            price: proProducts["request-volume"],
            // No quantity for usage based pricing
          },
        ],
        mode: "subscription",
        success_url: `${origin}/dashboard`,
        cancel_url: `${origin}/dashboard`,
        metadata: {
          orgId: this.authParams.organizationId,
        },
        subscription_data: {
          metadata: {
            orgId: this.authParams.organizationId,
            tier: "growth",
          },
        },
        allow_promotion_codes: true,
      });

      return ok(session.url!);
    } catch (error: any) {
      return err(`Error creating upgrade link: ${error.message}`);
    }
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

      const missingProducts = Object.values(proProducts).filter(
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
