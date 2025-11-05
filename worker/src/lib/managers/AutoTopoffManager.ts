import { createClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import { Result, err, ok } from "../util/results";
import Stripe from "stripe";

// Constants
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache for auto-topoff settings
const RATE_LIMIT_HOURS = 1; // Minimum hours between auto top-offs
const RATE_LIMIT_MS = RATE_LIMIT_HOURS * 60 * 60 * 1000;
const MAX_CONSECUTIVE_FAILURES = 3; // Auto-disable after this many failures
const STRIPE_FEE_PERCENT = 0.03; // 3% Stripe fee
const STRIPE_FEE_FIXED_CENTS = 30; // $0.30 fixed Stripe fee
const ENGINEERING_EMAIL = "engineering@helicone.ai";

export interface AutoTopoffSettings {
  enabled: boolean;
  thresholdCents: number;
  topoffAmountCents: number;
  stripePaymentMethodId: string | null;
  lastTopoffAt: Date | null;
  consecutiveFailures: number;
}

export class AutoTopoffManager {
  private supabaseClient;
  private stripe: Stripe;
  private env: Env;
  private cache: Map<
    string,
    { data: AutoTopoffSettings | null; timestamp: number }
  > = new Map();
  private readonly CACHE_TTL_MS = CACHE_TTL_MS;

  constructor(env: Env) {
    this.env = env;
    this.supabaseClient = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-07-30.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });
  }

  /**
   * Fetches auto topoff settings for an organization
   * Results are cached for 10 minutes
   */
  private async getAutoTopoffSettings(
    orgId: string
  ): Promise<Result<AutoTopoffSettings | null, string>> {
    // Check cache first
    const cached = this.cache.get(orgId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return ok(cached.data);
    }

    try {
      const { data, error } = await this.supabaseClient
        .from("organization_auto_topoff")
        .select("*")
        .eq("organization_id", orgId)
        .single();

      if (error) {
        // If no row exists, return null (not an error)
        if (error.code === "PGRST116") {
          // Cache the null result
          this.cache.set(orgId, { data: null, timestamp: Date.now() });
          return ok(null);
        }
        return err(`Error fetching auto topoff settings: ${error.message}`);
      }

      if (!data) {
        // Cache the null result
        this.cache.set(orgId, { data: null, timestamp: Date.now() });
        return ok(null);
      }

      const settings: AutoTopoffSettings = {
        enabled: data.enabled,
        thresholdCents: Number(data.threshold_cents),
        topoffAmountCents: Number(data.topoff_amount_cents),
        stripePaymentMethodId: data.stripe_payment_method_id,
        lastTopoffAt: data.last_topoff_at
          ? new Date(data.last_topoff_at)
          : null,
        consecutiveFailures: data.consecutive_failures,
      };

      // Cache the result
      this.cache.set(orgId, { data: settings, timestamp: Date.now() });

      return ok(settings);
    } catch (error) {
      return err(
        `Error fetching auto topoff settings: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Invalidates the cache for an organization
   */
  private invalidateCache(orgId: string): void {
    this.cache.delete(orgId);
  }

  /**
   * Checks if auto topoff should be triggered based on settings and current balance
   * Returns true if topoff should be initiated
   */
  async shouldTriggerTopoff(
    orgId: string,
    effectiveBalanceCents: number
  ): Promise<boolean> {
    // Get settings
    const settingsResult = await this.getAutoTopoffSettings(orgId);
    if (settingsResult.error || !settingsResult.data) {
      return false;
    }

    const settings = settingsResult.data;

    // Don't trigger if not enabled
    if (!settings.enabled) {
      return false;
    }

    // Don't trigger if no payment method
    if (!settings.stripePaymentMethodId) {
      return false;
    }

    // Don't trigger if balance is above threshold
    if (effectiveBalanceCents >= settings.thresholdCents) {
      return false;
    }

    // Don't trigger if too many consecutive failures
    if (settings.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log(
        `Auto topoff disabled for org due to ${settings.consecutiveFailures} consecutive failures`
      );
      return false;
    }

    // Don't trigger if last topoff was less than the rate limit (rate limiting)
    if (settings.lastTopoffAt) {
      const rateLimitTime = new Date(Date.now() - RATE_LIMIT_MS);
      if (settings.lastTopoffAt > rateLimitTime) {
        console.log(
          `Auto topoff rate limited - last topoff was at ${settings.lastTopoffAt.toISOString()}`
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Updates the last topoff timestamp to prevent race conditions
   */
  private async updateLastTopoffTimestamp(
    orgId: string
  ): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabaseClient
        .from("organization_auto_topoff")
        .update({ last_topoff_at: new Date().toISOString() })
        .eq("organization_id", orgId);

      if (error) {
        return err(`Error updating last topoff timestamp: ${error.message}`);
      }

      // Invalidate cache after successful update
      this.invalidateCache(orgId);

      return ok(undefined);
    } catch (error) {
      return err(
        `Error updating last topoff timestamp: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Initiates an auto topoff by creating a Stripe PaymentIntent
   */
  private async initiateTopoff(orgId: string): Promise<Result<string, string>> {
    try {
      // Get settings
      const settingsResult = await this.getAutoTopoffSettings(orgId);
      if (settingsResult.error || !settingsResult.data) {
        return err("Auto topoff settings not found");
      }

      const settings = settingsResult.data;

      if (!settings.stripePaymentMethodId) {
        return err("No payment method configured");
      }

      // Get customer ID from organization
      const { data: org, error: orgError } = await this.supabaseClient
        .from("organization")
        .select("stripe_customer_id")
        .eq("id", orgId)
        .single();

      if (orgError || !org?.stripe_customer_id) {
        return err("Organization does not have a Stripe customer ID");
      }

      // Create idempotency key based on org and timestamp
      const idempotencyKey = `${orgId}-autotopoff-${Date.now()}`;

      // Calculate fees (same as manual purchases)
      const creditsCents = settings.topoffAmountCents;
      const percentFee = Math.ceil(creditsCents * STRIPE_FEE_PERCENT);
      const fixedFeeCents = STRIPE_FEE_FIXED_CENTS;
      const stripeFeeCents = percentFee + fixedFeeCents;
      const totalCents = creditsCents + stripeFeeCents;

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount: totalCents,
          currency: "usd",
          customer: org.stripe_customer_id,
          payment_method: settings.stripePaymentMethodId,
          off_session: true, // This allows charging without customer present
          confirm: true, // Automatically confirm the payment
          metadata: {
            orgId: orgId,
            productId: this.env.STRIPE_CLOUD_GATEWAY_TOKEN_USAGE_PRODUCT,
            creditsAmountCents: creditsCents.toString(),
            stripeFeeCents: stripeFeeCents.toString(),
            totalAmountCents: totalCents.toString(),
            autoTopoff: "true",
          },
        },
        {
          idempotencyKey,
        }
      );

      console.log(
        `Auto topoff initiated for org ${orgId}: ${creditsCents} cents + ${stripeFeeCents} cents fee = ${totalCents} cents total. PaymentIntent: ${paymentIntent.id}`
      );

      return ok(paymentIntent.id);
    } catch (error) {
      // Determine error message
      let errorMessage: string;
      if (error instanceof Stripe.errors.StripeCardError) {
        errorMessage = `Card declined: ${error.message}`;
      } else if (error instanceof Stripe.errors.StripeInvalidRequestError) {
        errorMessage = `Invalid request: ${error.message}`;
      } else {
        errorMessage = `Error initiating auto topoff: ${error instanceof Error ? error.message : "Unknown error"}`;
      }

      // Increment failure counter
      await this.incrementFailureCounter(orgId);

      // Send failure notification
      await this.sendFailureNotification(orgId, errorMessage).catch(
        (notificationError) => {
          console.error(
            `Failed to send auto topoff failure notification for org ${orgId}:`,
            notificationError
          );
        }
      );

      return err(errorMessage);
    }
  }

  /**
   * Increments the consecutive failure counter
   */
  private async incrementFailureCounter(
    orgId: string
  ): Promise<Result<void, string>> {
    try {
      // Get current settings
      const settingsResult = await this.getAutoTopoffSettings(orgId);
      if (settingsResult.error || !settingsResult.data) {
        return err("Could not fetch settings to increment failure counter");
      }

      const currentFailures = settingsResult.data.consecutiveFailures;
      const newFailureCount = currentFailures + 1;

      // Simple update - no race conditions due to Durable Object alarm guarantee
      const { error } = await this.supabaseClient
        .from("organization_auto_topoff")
        .update({ consecutive_failures: newFailureCount })
        .eq("organization_id", orgId);

      if (error) {
        return err(`Error incrementing failure counter: ${error.message}`);
      }

      // Invalidate cache after successful update
      this.invalidateCache(orgId);

      // Check if we hit the threshold - disable and notify
      if (newFailureCount >= MAX_CONSECUTIVE_FAILURES) {
        console.log(
          `Auto topoff hit ${MAX_CONSECUTIVE_FAILURES} failures for org ${orgId}, disabling...`
        );

        // Disable auto topoff
        const disableResult = await this.disableAutoTopoff(orgId);
        if (disableResult.error) {
          console.error(
            `Failed to disable auto topoff for org ${orgId}: ${disableResult.error}`
          );
        }

        // Send disabled notification (critical email)
        await this.sendDisabledNotification(orgId).catch(
          (notificationError) => {
            console.error(
              `Failed to send auto topoff disabled notification for org ${orgId}:`,
              notificationError
            );
          }
        );
      }

      return ok(undefined);
    } catch (error) {
      return err(
        `Error incrementing failure counter: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Resets the consecutive failure counter (called on successful payment)
   */
  private async resetFailureCounter(
    orgId: string
  ): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabaseClient
        .from("organization_auto_topoff")
        .update({ consecutive_failures: 0 })
        .eq("organization_id", orgId);

      if (error) {
        return err(`Error resetting failure counter: ${error.message}`);
      }

      // Invalidate cache after successful update
      this.invalidateCache(orgId);

      return ok(undefined);
    } catch (error) {
      return err(
        `Error resetting failure counter: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Disables auto topoff for an organization (called after too many failures)
   */
  private async disableAutoTopoff(
    orgId: string
  ): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabaseClient
        .from("organization_auto_topoff")
        .update({ enabled: false })
        .eq("organization_id", orgId);

      if (error) {
        return err(`Error disabling auto topoff: ${error.message}`);
      }

      // Invalidate cache after successful update
      this.invalidateCache(orgId);

      console.log(`Auto topoff disabled for org ${orgId} due to failures`);
      return ok(undefined);
    } catch (error) {
      return err(
        `Error disabling auto topoff: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Sends failure notification email to org owner and engineering team
   */
  private async sendFailureNotification(
    orgId: string,
    errorMessage: string
  ): Promise<void> {
    try {
      // Get settings
      const settingsResult = await this.getAutoTopoffSettings(orgId);
      if (settingsResult.error || !settingsResult.data) {
        console.error(
          `Failed to fetch auto topoff settings for notification: ${settingsResult.error}`
        );
        return;
      }

      const settings = settingsResult.data;

      // Get organization details including owner email
      const { data: org, error: orgError } = await this.supabaseClient
        .from("organization")
        .select("name, owner")
        .eq("id", orgId)
        .single();

      if (orgError || !org) {
        console.error(
          `Failed to fetch organization for auto topoff notification: ${orgError?.message}`
        );
        return;
      }

      // Get owner's email
      const { data: ownerData, error: ownerError } =
        await this.supabaseClient.auth.admin.getUserById(org.owner);

      if (ownerError || !ownerData?.user?.email) {
        console.error(
          `Failed to fetch owner email for auto topoff notification: ${ownerError?.message}`
        );
        return;
      }

      const ownerEmail = ownerData.user.email;

      // Format email
      const subject = `⚠️ Auto Top-off Failed - ${org.name}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Auto Top-off Payment Failed</h2>

          <p>We attempted to automatically top off your Helicone account but the payment failed.</p>

          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Details</h3>
            <p><strong>Organization:</strong> ${org.name}</p>
            <p><strong>Organization ID:</strong> ${orgId}</p>
            <p><strong>Error:</strong> ${errorMessage}</p>
            <p><strong>Threshold:</strong> $${settings.thresholdCents / 100}</p>
            <p><strong>Top-off Amount:</strong> $${settings.topoffAmountCents / 100}</p>
            <p><strong>Consecutive Failures:</strong> ${settings.consecutiveFailures + 1}</p>
          </div>

          ${
            settings.consecutiveFailures + 1 >= MAX_CONSECUTIVE_FAILURES
              ? `
          <div style="background-color: #fee2e2; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>⚠️ Warning:</strong> Auto top-off will be disabled after ${MAX_CONSECUTIVE_FAILURES} consecutive failures.</p>
          </div>
          `
              : ""
          }

          <h3>Next Steps</h3>
          <ol>
            <li>Check your payment method is valid and has sufficient funds</li>
            <li>Update your payment method in your <a href="https://helicone.ai/settings">Helicone settings</a></li>
            <li>Ensure your card supports recurring payments</li>
          </ol>

          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
            If you need assistance, please reply to this email or contact us at support@helicone.ai
          </p>
        </div>
      `;

      const text = `
Auto Top-off Payment Failed

We attempted to automatically top off your Helicone account but the payment failed.

Details:
- Organization: ${org.name}
- Organization ID: ${orgId}
- Error: ${errorMessage}
- Threshold: $${settings.thresholdCents / 100}
- Top-off Amount: $${settings.topoffAmountCents / 100}
- Consecutive Failures: ${settings.consecutiveFailures + 1}

${
  settings.consecutiveFailures + 1 >= MAX_CONSECUTIVE_FAILURES
    ? `⚠️ Warning: Auto top-off will be disabled after ${MAX_CONSECUTIVE_FAILURES} consecutive failures.\n`
    : ""
}

Next Steps:
1. Check your payment method is valid and has sufficient funds
2. Update your payment method in your Helicone settings
3. Ensure your card supports recurring payments

If you need assistance, please contact us at support@helicone.ai
      `;

      // Send email via Resend
      const recipients = [ownerEmail, ENGINEERING_EMAIL];

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Helicone Billing <billing@helicone.ai>",
          to: recipients,
          subject: subject,
          html: html,
          text: text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to send auto topoff failure email: ${response.status} ${response.statusText} ${errorText}`
        );
        return;
      }

      console.log(
        `Auto topoff failure notification sent to ${recipients.join(", ")} for org ${orgId}`
      );
    } catch (error) {
      console.error(
        `Unexpected error sending auto topoff failure notification:`,
        error
      );
    }
  }

  /**
   * Sends notification when auto top-off is disabled after max failures
   */
  private async sendDisabledNotification(orgId: string): Promise<void> {
    try {
      // Get settings
      const settingsResult = await this.getAutoTopoffSettings(orgId);
      if (settingsResult.error || !settingsResult.data) {
        console.error(
          `Failed to fetch auto topoff settings for disabled notification: ${settingsResult.error}`
        );
        return;
      }

      const settings = settingsResult.data;

      // Get organization details including owner email
      const { data: org, error: orgError } = await this.supabaseClient
        .from("organization")
        .select("name, owner")
        .eq("id", orgId)
        .single();

      if (orgError || !org) {
        console.error(
          `Failed to fetch organization for auto topoff disabled notification: ${orgError?.message}`
        );
        return;
      }

      // Get owner's email
      const { data: ownerData, error: ownerError } =
        await this.supabaseClient.auth.admin.getUserById(org.owner);

      if (ownerError || !ownerData?.user?.email) {
        console.error(
          `Failed to fetch owner email for auto topoff disabled notification: ${ownerError?.message}`
        );
        return;
      }

      const ownerEmail = ownerData.user.email;

      // Format email
      const subject = `🚨 Auto Top-off DISABLED - ${org.name} - Action Required`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #991b1b;">🚨 Auto Top-off Has Been Disabled</h2>

          <div style="background-color: #fee2e2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #991b1b; font-weight: bold;">
              Auto top-off has been automatically disabled after ${MAX_CONSECUTIVE_FAILURES} consecutive payment failures.
            </p>
          </div>

          <p><strong>Impact:</strong> Your account will no longer automatically recharge when your balance is low. You may experience service interruptions if your balance reaches zero.</p>

          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Account Details</h3>
            <p><strong>Organization:</strong> ${org.name}</p>
            <p><strong>Organization ID:</strong> ${orgId}</p>
            <p><strong>Threshold:</strong> $${settings.thresholdCents / 100}</p>
            <p><strong>Top-off Amount:</strong> $${settings.topoffAmountCents / 100}</p>
            <p><strong>Total Failures:</strong> ${settings.consecutiveFailures}</p>
          </div>

          <h3>Required Actions</h3>
          <ol>
            <li><strong>Fix your payment method:</strong> Update your card details or add a new payment method in your <a href="https://helicone.ai/settings" style="color: #0ea5e9;">Helicone settings</a></li>
            <li><strong>Check your balance:</strong> If your balance is low, manually purchase credits to avoid service interruption</li>
            <li><strong>Re-enable auto top-off:</strong> Once your payment method is working, go to <a href="https://helicone.ai/credits" style="color: #0ea5e9;">Credits Settings</a> to re-enable auto top-off</li>
          </ol>

          <div style="background-color: #fef3c7; padding: 12px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Note:</strong> Auto top-off will remain disabled until you manually re-enable it in your settings, even after updating your payment method.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
            If you need assistance, please reply to this email or contact us at support@helicone.ai
          </p>
        </div>
      `;

      const text = `
🚨 Auto Top-off Has Been DISABLED

Auto top-off has been automatically disabled after ${MAX_CONSECUTIVE_FAILURES} consecutive payment failures.

IMPACT: Your account will no longer automatically recharge when your balance is low. You may experience service interruptions if your balance reaches zero.

Account Details:
- Organization: ${org.name}
- Organization ID: ${orgId}
- Threshold: $${settings.thresholdCents / 100}
- Top-off Amount: $${settings.topoffAmountCents / 100}
- Total Failures: ${settings.consecutiveFailures}

Required Actions:
1. Fix your payment method: Update your card details or add a new payment method in your Helicone settings (https://helicone.ai/settings)
2. Check your balance: If your balance is low, manually purchase credits to avoid service interruption
3. Re-enable auto top-off: Once your payment method is working, go to Credits Settings (https://helicone.ai/credits) to re-enable auto top-off

Note: Auto top-off will remain disabled until you manually re-enable it in your settings, even after updating your payment method.

If you need assistance, please contact us at support@helicone.ai
      `;

      // Send email via Resend
      const recipients = [ownerEmail, ENGINEERING_EMAIL];

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Helicone Billing <billing@helicone.ai>",
          to: recipients,
          subject: subject,
          html: html,
          text: text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to send auto topoff disabled email: ${response.status} ${response.statusText} ${errorText}`
        );
        return;
      }

      console.log(
        `Auto topoff disabled notification sent to ${recipients.join(", ")} for org ${orgId}`
      );
    } catch (error) {
      console.error(
        `Unexpected error sending auto topoff disabled notification:`,
        error
      );
    }
  }
}
