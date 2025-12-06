import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import { registry } from "@helicone-package/cost/models/registry";
import { MODEL_NAME_MAPPINGS } from "@helicone-package/cost/models/provider-helpers";
import { err, ok, Result } from "../../../../packages/common/result";
import {
  CreditBalanceResponse,
  PaginatedPurchasedCredits,
} from "../controllers/public/creditsController";
import { AuthParams } from "../packages/common/auth/types";
import { isError, resultMap } from "../packages/common/result";
import { BaseManager } from "./BaseManager";
import { WalletManager } from "./wallet/WalletManager";
import { dbExecute, dbQueryClickhouse } from "../lib/shared/db/dbExecute";
import {
  OrgDiscount,
  getOrgDiscounts,
  findDiscount,
} from "../utils/discountCalculator";
import { getCacheTokenAdjustmentsByModel } from "../utils/cacheTokenAdjustments";

export interface PTBInvoice {
  id: string;
  organizationId: string;
  stripeInvoiceId: string | null;
  hostedInvoiceUrl: string | null;
  startDate: string;
  endDate: string;
  amountCents: number;
  notes: string | null;
  createdAt: string;
}

export interface ModelSpend {
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  pricing: {
    inputPer1M: number;
    outputPer1M: number;
    cacheReadPer1M?: number;
    cacheWritePer1M?: number;
  } | null;
  subtotal: number; // Cost before discount (USD), includes cache adjustment
  discountPercent: number; // 0-100
  total: number; // Cost after discount (USD)
  cacheAdjustment?: number; // Admin-only: cache write adjustment amount (USD)
}

export interface SpendBreakdownResponse {
  models: ModelSpend[];
  totalCost: number;
  timeRange: { start: string; end: string };
}

type TimeRange = "7d" | "30d" | "90d" | "all";

export class CreditsManager extends BaseManager {
  constructor(authParams: AuthParams) {
    super(authParams);
  }

  public async getCreditsBalance(): Promise<
    Result<CreditBalanceResponse, string>
  > {
    const adminWalletManager = new WalletManager(
      this.authParams.organizationId
    );
    const walletState = await adminWalletManager.getWalletState();
    if (isError(walletState)) {
      return err(walletState.error);
    }
    return ok({
      totalCreditsPurchased: walletState.data.totalCredits,
      balance: walletState.data.effectiveBalance,
    });
  }

  public async listTokenUsagePayments(params: {
    page: number;
    pageSize: number;
  }): Promise<Result<PaginatedPurchasedCredits, string>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set("page", params.page.toString());
      queryParams.set("pageSize", params.pageSize.toString());
      queryParams.set("orgId", this.authParams.organizationId);
      const paymentsResponse = await fetch(
        `${process.env.HELICONE_WORKER_API}/wallet/credits/purchases?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.HELICONE_MANUAL_ACCESS_KEY}`,
          },
        }
      );
      if (!paymentsResponse.ok) {
        return err(
          `Error retrieving credit balance transactions: ${paymentsResponse.statusText}`
        );
      }

      const payments = await paymentsResponse.json();

      return ok({
        purchases: payments.purchases,
        total: payments.total,
        page: params.page,
        pageSize: params.pageSize,
      });
    } catch (error: any) {
      return err(
        `Error retrieving credit balance transactions: ${error.message}`
      );
    }
  }

  getTotalSpend(): Promise<Result<number, string>> {
    return new Promise(async (resolve) => {
      try {
        const query = `
          SELECT spend / ${COST_PRECISION_MULTIPLIER / 100} as spend_cents
          FROM organization_ptb_spend_mv FINAL
          WHERE organization_id = {val_0 : String}
        `;

        const res = await dbQueryClickhouse<{ spend_cents: string }>(query, [
          this.authParams.organizationId,
        ]);

        return resultMap(res, (d) => ({
          spend_cents: +(d?.[0]?.spend_cents ?? 0),
        }));
      } catch (error: any) {
        resolve(err(`Error retrieving total spend: ${error.message}`));
      }
    });
  }

  public async getSpendBreakdown(
    timeRange: TimeRange
  ): Promise<Result<SpendBreakdownResponse, string>> {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        startDate = new Date("2020-01-01");
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return this.getSpendBreakdownByDateRange(startDate, now);
  }

  /**
   * Get spend breakdown for a custom date range.
   * Shows raw costs without discounts - discounts are only applied during invoice creation.
   */
  public async getSpendBreakdownByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Result<SpendBreakdownResponse, string>> {
    try {
      const query = `
        SELECT
          model,
          provider,
          count(*) as request_count,
          sum(prompt_tokens) as prompt_tokens,
          sum(completion_tokens) as completion_tokens,
          sum(prompt_cache_read_tokens) as cache_read_tokens,
          sum(prompt_cache_write_tokens) as cache_write_tokens,
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

      const res = await dbQueryClickhouse<{
        model: string;
        provider: string;
        request_count: string;
        prompt_tokens: string;
        completion_tokens: string;
        cache_read_tokens: string;
        cache_write_tokens: string;
        cost: string;
      }>(query, [this.authParams.organizationId, startDate, endDate]);

      if (isError(res)) {
        return err(res.error);
      }

      // Get cache token adjustments for this org
      const cacheAdjustments = getCacheTokenAdjustmentsByModel(
        this.authParams.organizationId,
        startDate,
        endDate
      );

      // Get discounts for this org
      const discounts = await getOrgDiscounts(this.authParams.organizationId);

      const models: ModelSpend[] = res.data.map((row) => {
        // Look up pricing from registry using model:provider key
        // Apply model name mapping for backward compatibility (e.g., kimi-k2-instruct -> kimi-k2-0905)
        const normalizedModel = MODEL_NAME_MAPPINGS[row.model] || row.model;
        let pricing: {
          inputPer1M: number;
          outputPer1M: number;
          cacheReadPer1M?: number;
          cacheWritePer1M?: number;
        } | null = null;
        const configResult = registry.getModelProviderConfig(
          normalizedModel,
          row.provider
        );
        if (!configResult.error && configResult.data?.pricing?.[0]) {
          const p = configResult.data.pricing[0];
          // Cache multipliers vary by provider:
          // - Anthropic: cachedInput = 0.1 (10% of input), write = 1.25× input
          // - OpenAI: cachedInput = 0.5 (50% of input), no write cost
          const cacheMultipliers = p.cacheMultipliers;
          pricing = {
            inputPer1M: p.input * 1_000_000,
            outputPer1M: p.output * 1_000_000,
            // Cache read price from multiplier, or undefined if not available
            cacheReadPer1M: cacheMultipliers?.cachedInput
              ? p.input * cacheMultipliers.cachedInput * 1_000_000
              : undefined,
            // Cache write price: Anthropic charges 1.25× input, OpenAI has no write cost
            // Only set if there's a 5m or 1h write multiplier (Anthropic)
            cacheWritePer1M:
              cacheMultipliers?.write5m || cacheMultipliers?.write1h
                ? p.input * (cacheMultipliers.write5m ?? cacheMultipliers.write1h ?? 1.25) * 1_000_000
                : undefined,
          };
        }

        const baseCost = parseFloat(row.cost);
        const adjustment = cacheAdjustments.get(row.model);
        const cacheAdjustmentUsd = adjustment?.amountUsd || 0;
        const missingCacheWriteTokens = adjustment?.missingTokens || 0;
        const subtotal = baseCost + cacheAdjustmentUsd;
        // Apply discounts from org config
        const discountPercent = findDiscount(discounts, row.model, row.provider);
        const total = subtotal * (1 - discountPercent / 100);

        return {
          model: row.model,
          provider: row.provider,
          promptTokens: parseInt(row.prompt_tokens, 10) || 0,
          completionTokens: parseInt(row.completion_tokens, 10) || 0,
          cacheReadTokens: parseInt(row.cache_read_tokens, 10) || 0,
          cacheWriteTokens:
            (parseInt(row.cache_write_tokens, 10) || 0) +
            missingCacheWriteTokens,
          pricing,
          subtotal,
          discountPercent,
          total,
          // Include adjustment for admin visibility (optional field)
          ...(cacheAdjustmentUsd > 0 && {
            cacheAdjustment: cacheAdjustmentUsd,
          }),
        };
      });

      const totalCost = models.reduce((sum, m) => sum + m.total, 0);

      return ok({
        models,
        totalCost,
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      });
    } catch (error: any) {
      return err(`Error retrieving spend breakdown: ${error.message}`);
    }
  }

  /**
   * List all invoices for the current org (read-only for customers).
   */
  public async listInvoices(): Promise<Result<PTBInvoice[], string>> {
    try {
      const result = await dbExecute<{
        id: string;
        organization_id: string;
        stripe_invoice_id: string | null;
        hosted_invoice_url: string | null;
        start_date: string;
        end_date: string;
        amount_cents: string;
        notes: string | null;
        created_at: string;
      }>(
        `SELECT id, organization_id, stripe_invoice_id, hosted_invoice_url,
                start_date, end_date, amount_cents, notes, created_at
         FROM ptb_invoices
         WHERE organization_id = $1
         ORDER BY created_at DESC`,
        [this.authParams.organizationId]
      );

      if (result.error) {
        return err(`Error listing invoices: ${result.error}`);
      }

      const invoices: PTBInvoice[] = (result.data || []).map((row) => ({
        id: row.id,
        organizationId: row.organization_id,
        stripeInvoiceId: row.stripe_invoice_id,
        hostedInvoiceUrl: row.hosted_invoice_url,
        startDate: row.start_date,
        endDate: row.end_date,
        amountCents: parseInt(row.amount_cents, 10),
        notes: row.notes,
        createdAt: row.created_at,
      }));

      return ok(invoices);
    } catch (error: any) {
      return err(`Error listing invoices: ${error.message}`);
    }
  }

  /**
   * Get discount rules configured for this organization.
   */
  public async getDiscounts(): Promise<Result<OrgDiscount[], string>> {
    try {
      const result = await dbExecute<{ discounts: OrgDiscount[] | null }>(
        `SELECT discounts FROM organization WHERE id = $1`,
        [this.authParams.organizationId]
      );

      if (result.error) {
        return err(`Error fetching discounts: ${result.error}`);
      }

      if (!result.data || result.data.length === 0) {
        return ok([]);
      }

      return ok(result.data[0].discounts || []);
    } catch (error: any) {
      return err(`Error fetching discounts: ${error.message}`);
    }
  }
}
