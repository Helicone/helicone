import { err, ok, Result } from "../../packages/common/result";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import { dbExecute, dbQueryClickhouse } from "../../lib/shared/db/dbExecute";
import {
  OrgDiscount,
  getOrgDiscounts,
  findDiscount,
} from "../../utils/discountCalculator";
import {
  getCacheTokenAdjustment,
  getTotalCacheTokenAdjustment,
} from "../../utils/cacheTokenAdjustments";
import Stripe from "stripe";
import { SecretManager } from "@helicone-package/secrets/SecretManager";

export interface InvoiceSummary {
  totalSpendCents: number;
  totalInvoicedCents: number;
  uninvoicedBalanceCents: number;
  lastInvoiceEndDate: string | null;
}

export interface CreateInvoiceResponse {
  invoiceId: string;
  hostedInvoiceUrl: string | null;
  dashboardUrl: string;
  amountCents: number;
  ptbInvoiceId: string;
}

/**
 * Manages PTB invoicing operations for admin users.
 * Handles invoice creation, summary, and discount management.
 */
export class InvoicingManager {
  constructor(private orgId: string) {}

  /**
   * Get invoice summary: total spend, total invoiced, uninvoiced balance.
   */
  async getInvoiceSummary(): Promise<Result<InvoiceSummary, string>> {
    try {
      // Get total PTB spend from ClickHouse (all time)
      const spendQuery = `
        SELECT sum(cost) / ${COST_PRECISION_MULTIPLIER} as total_cost
        FROM request_response_rmt
        WHERE organization_id = {val_0 : String}
          AND is_passthrough_billing = true
      `;

      const spendResult = await dbQueryClickhouse<{ total_cost: string }>(
        spendQuery,
        [this.orgId]
      );

      if (spendResult.error) {
        return err(`Error fetching spend: ${spendResult.error}`);
      }

      const baseSpendUsd = parseFloat(spendResult.data?.[0]?.total_cost || "0");

      // Add cache token adjustments for orgs with missing data
      const cacheAdjustmentUsd = getTotalCacheTokenAdjustment(this.orgId);
      const totalSpendUsd = baseSpendUsd + cacheAdjustmentUsd;
      const totalSpendCents = Math.round(totalSpendUsd * 100);

      // Get total invoiced from Postgres
      const invoicedResult = await dbExecute<{
        total_invoiced: string;
        last_end_date: string | null;
      }>(
        `SELECT
           COALESCE(SUM(amount_cents), 0) as total_invoiced,
           MAX(end_date) as last_end_date
         FROM ptb_invoices
         WHERE organization_id = $1`,
        [this.orgId]
      );

      if (invoicedResult.error) {
        return err(`Error fetching invoiced amount: ${invoicedResult.error}`);
      }

      const totalInvoicedCents = parseInt(
        invoicedResult.data?.[0]?.total_invoiced || "0",
        10
      );
      const lastInvoiceEndDate =
        invoicedResult.data?.[0]?.last_end_date || null;

      return ok({
        totalSpendCents,
        totalInvoicedCents,
        uninvoicedBalanceCents: totalSpendCents - totalInvoicedCents,
        lastInvoiceEndDate,
      });
    } catch (error: any) {
      return err(`Error fetching invoice summary: ${error.message}`);
    }
  }

  /**
   * Create a Stripe invoice from spend breakdown and record it.
   * Creates line items in Stripe for each model/provider combo with discounts applied.
   */
  async createInvoice(
    startDate: Date,
    endDate: Date,
    daysUntilDue: number = 30
  ): Promise<Result<CreateInvoiceResponse, string>> {
    try {
      // 1. Get org's Stripe customer ID
      const orgResult = await dbExecute<{
        stripe_customer_id: string | null;
        name: string;
      }>(
        `SELECT stripe_customer_id, name FROM organization WHERE id = $1`,
        [this.orgId]
      );

      if (orgResult.error || !orgResult.data?.[0]) {
        return err("Organization not found");
      }

      const stripeCustomerId = orgResult.data[0].stripe_customer_id;
      const orgName = orgResult.data[0].name;

      if (!stripeCustomerId) {
        return err("Organization does not have a Stripe customer ID");
      }

      // 2. Get spend breakdown for date range
      const spendQuery = `
        SELECT
          model,
          provider,
          sum(prompt_tokens) as prompt_tokens,
          sum(completion_tokens) as completion_tokens,
          sum(cost) / ${COST_PRECISION_MULTIPLIER} as cost
        FROM request_response_rmt
        WHERE organization_id = {val_0 : String}
          AND is_passthrough_billing = true
          AND request_created_at >= {val_1 : DateTime64(3)}
          AND request_created_at < {val_2 : DateTime64(3)}
        GROUP BY model, provider
        HAVING cost > 0
        ORDER BY cost DESC
      `;

      const spendResult = await dbQueryClickhouse<{
        model: string;
        provider: string;
        prompt_tokens: string;
        completion_tokens: string;
        cost: string;
      }>(spendQuery, [this.orgId, startDate, endDate]);

      if (spendResult.error) {
        return err(`Error fetching spend data: ${spendResult.error}`);
      }

      if (!spendResult.data || spendResult.data.length === 0) {
        return err(`No spend data found for ${startDate.toISOString()} to ${endDate.toISOString()}`);
      }

      // 3. Get discounts for this org
      const discounts = await getOrgDiscounts(this.orgId);

      // 4. Initialize Stripe
      const stripe = new Stripe(SecretManager.getSecret("STRIPE_SECRET_KEY")!, {
        apiVersion: "2025-02-24.acacia",
      });

      // 5. Create the invoice (in draft mode)
      const periodStart = startDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const periodEnd = endDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const invoice = await stripe.invoices.create({
        customer: stripeCustomerId,
        collection_method: "send_invoice",
        days_until_due: daysUntilDue,
        description: `API Usage: ${periodStart} - ${periodEnd}`,
        metadata: {
          orgId: this.orgId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: "ptb_usage",
        },
        pending_invoice_items_behavior: "exclude",
      });

      // 6. Create invoice items with discounts applied
      let totalAmountCents = 0;

      for (const item of spendResult.data) {
        const baseSubtotalUsd = parseFloat(item.cost);

        // Add cache token adjustment if applicable
        const cacheAdjustmentUsd = getCacheTokenAdjustment(
          this.orgId,
          item.model,
          startDate,
          endDate
        );
        const subtotalUsd = baseSubtotalUsd + cacheAdjustmentUsd;

        const discountPercent = findDiscount(discounts, item.model, item.provider);
        const totalUsd = subtotalUsd * (1 - discountPercent / 100);
        const amountCents = Math.round(totalUsd * 100);

        if (amountCents <= 0) continue;

        totalAmountCents += amountCents;

        const promptTokens = parseInt(item.prompt_tokens, 10) || 0;
        const completionTokens = parseInt(item.completion_tokens, 10) || 0;

        const modelInfo = `${item.model || "unknown"} (${item.provider || "unknown"})`;
        const discountInfo = discountPercent > 0 ? ` [${discountPercent}% discount]` : "";
        // Note: cacheAdjustmentUsd is added to subtotal but not shown in description (per user request)
        const tokenInfo = `${this.formatTokens(promptTokens)} input, ${this.formatTokens(completionTokens)} output`;
        const description = `${modelInfo}${discountInfo} - ${tokenInfo}`;

        await stripe.invoiceItems.create({
          customer: stripeCustomerId,
          invoice: invoice.id,
          amount: amountCents,
          currency: "usd",
          description,
        });
      }

      // 7. Record in ptb_invoices
      const ptbResult = await dbExecute<{ id: string }>(
        `INSERT INTO ptb_invoices (organization_id, stripe_invoice_id, start_date, end_date, amount_cents, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          this.orgId,
          invoice.id,
          startDate,
          endDate,
          totalAmountCents,
          `Auto-created invoice for ${orgName}`,
        ]
      );

      if (ptbResult.error) {
        console.error("Failed to record invoice in ptb_invoices:", ptbResult.error);
      }

      const dashboardUrl = `https://dashboard.stripe.com/invoices/${invoice.id}`;

      return ok({
        invoiceId: invoice.id,
        hostedInvoiceUrl: null,
        dashboardUrl,
        amountCents: totalAmountCents,
        ptbInvoiceId: ptbResult.data?.[0]?.id || "",
      });
    } catch (error: any) {
      return err(`Error creating invoice: ${error.message}`);
    }
  }

  /**
   * Delete a recorded invoice.
   */
  async deleteInvoice(invoiceId: string): Promise<Result<{ deleted: boolean }, string>> {
    try {
      const result = await dbExecute(
        `DELETE FROM ptb_invoices WHERE id = $1 AND organization_id = $2`,
        [invoiceId, this.orgId]
      );

      if (result.error) {
        return err(`Error deleting invoice: ${result.error}`);
      }

      return ok({ deleted: true });
    } catch (error: any) {
      return err(`Error deleting invoice: ${error.message}`);
    }
  }

  /**
   * Update an invoice's hosted URL (for after sending from Stripe).
   */
  async updateInvoice(
    invoiceId: string,
    hostedInvoiceUrl: string | null
  ): Promise<Result<{ updated: boolean }, string>> {
    try {
      const result = await dbExecute(
        `UPDATE ptb_invoices SET hosted_invoice_url = $1 WHERE id = $2 AND organization_id = $3`,
        [hostedInvoiceUrl, invoiceId, this.orgId]
      );

      if (result.error) {
        return err(`Error updating invoice: ${result.error}`);
      }

      return ok({ updated: true });
    } catch (error: any) {
      return err(`Error updating invoice: ${error.message}`);
    }
  }

  /**
   * Update discount rules for the organization.
   */
  async updateDiscounts(
    discounts: OrgDiscount[]
  ): Promise<Result<OrgDiscount[], string>> {
    try {
      // Validate discounts
      for (const discount of discounts) {
        if (discount.percent < 0 || discount.percent > 100) {
          return err("Discount percent must be between 0 and 100");
        }
      }

      const result = await dbExecute<{ discounts: OrgDiscount[] }>(
        `UPDATE organization SET discounts = $1 WHERE id = $2 RETURNING discounts`,
        [JSON.stringify(discounts), this.orgId]
      );

      if (result.error) {
        return err(`Error updating discounts: ${result.error}`);
      }

      if (!result.data || result.data.length === 0) {
        return err("Organization not found");
      }

      return ok(result.data[0].discounts || []);
    } catch (error: any) {
      return err(`Error updating discounts: ${error.message}`);
    }
  }

  private formatTokens(tokens: number): string {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(2)}M`;
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
    return tokens.toLocaleString();
  }
}
