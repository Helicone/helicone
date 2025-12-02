import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import { registry } from "@helicone-package/cost/models/registry";
import { ModelProviderName } from "@helicone-package/cost/models/providers";
import { err, ok, Result } from "../../../../packages/common/result";
import {
  CreditBalanceResponse,
  PaginatedPurchasedCredits,
} from "../controllers/public/creditsController";
import { AuthParams } from "../packages/common/auth/types";
import { isError, resultMap } from "../packages/common/result";
import { BaseManager } from "./BaseManager";
import { WalletManager } from "./wallet/WalletManager";
import { dbQueryClickhouse } from "../lib/shared/db/dbExecute";

export interface ModelSpend {
  model: string;
  provider: string;
  cost: number; // USD
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  pricing: {
    inputPer1M: number;
    outputPer1M: number;
  } | null;
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
    try {
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
          // Use a very old date to get all data
          startDate = new Date("2020-01-01");
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const query = `
        SELECT
          model,
          provider,
          count(*) as request_count,
          sum(prompt_tokens) as prompt_tokens,
          sum(completion_tokens) as completion_tokens,
          sum(cost) / ${COST_PRECISION_MULTIPLIER} as cost
        FROM request_response_rmt
        WHERE organization_id = {val_0 : String}
          AND is_passthrough_billing = true
          AND request_created_at >= {val_1 : DateTime64(3)}
          AND request_created_at < {val_2 : DateTime64(3)}
        GROUP BY model, provider
        ORDER BY cost DESC
        LIMIT 50
      `;

      const res = await dbQueryClickhouse<{
        model: string;
        provider: string;
        request_count: string;
        prompt_tokens: string;
        completion_tokens: string;
        cost: string;
      }>(query, [this.authParams.organizationId, startDate, now]);

      if (isError(res)) {
        return err(res.error);
      }

      const models: ModelSpend[] = res.data.map((row) => {
        // Look up pricing from registry
        let pricing: { inputPer1M: number; outputPer1M: number } | null = null;
        const configResult = registry.getModelProviderConfigByProviderModelId(
          row.model,
          row.provider as ModelProviderName
        );
        if (!configResult.error && configResult.data?.pricing?.[0]) {
          const p = configResult.data.pricing[0];
          pricing = {
            inputPer1M: p.input * 1_000_000,
            outputPer1M: p.output * 1_000_000,
          };
        }

        return {
          model: row.model,
          provider: row.provider,
          cost: parseFloat(row.cost),
          requestCount: parseInt(row.request_count, 10),
          promptTokens: parseInt(row.prompt_tokens, 10) || 0,
          completionTokens: parseInt(row.completion_tokens, 10) || 0,
          pricing,
        };
      });

      const totalCost = models.reduce((sum, m) => sum + m.cost, 0);

      return ok({
        models,
        totalCost,
        timeRange: {
          start: startDate.toISOString(),
          end: now.toISOString(),
        },
      });
    } catch (error: any) {
      return err(`Error retrieving spend breakdown: ${error.message}`);
    }
  }
}
