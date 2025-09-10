import { buildFilterWithAuthClickHouse } from "@helicone-package/filters/filters";
import { err, ok, Result } from "../../../../packages/common/result";
import { AuthParams } from "../packages/common/auth/types";
import { BaseManager } from "./BaseManager";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import { dbQueryClickhouse } from "../lib/shared/db/dbExecute";
import { isError, resultMap } from "../packages/common/result";
import { CreditBalanceResponse, PaginatedPurchasedCredits } from "../controllers/public/creditsController";

export class CreditsManager extends BaseManager {
  constructor(authParams: AuthParams) {
    super(authParams);
  }

  public async getCreditsBalance(): Promise<Result<CreditBalanceResponse, string>> {
    try {
      const creditSumResponse = await fetch(
        `${process.env.HELICONE_WORKER_API}/wallet/credits/total?orgId=${this.authParams.organizationId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.HELICONE_MANUAL_ACCESS_KEY}`,
          },
        }
      );
      const creditSum = await creditSumResponse.json();
      const debits = await getAiGatewaySpend(this.authParams.organizationId);
      if (isError(debits)) {
        return err(debits.error);
      }
      const balance = creditSum.totalCredits - debits.data.cost;

      return ok({ balance, totalCreditsPurchased: creditSum.totalCredits });
    } catch (error: any) {
      return err(`Error retrieving credit balance: ${error.message}`);
    }
  }

  public async getTotalSpend(): Promise<Result<number, string>> {
    const debits = await getAiGatewaySpend(this.authParams.organizationId);
    if (isError(debits)) {
      return err(debits.error);
    }
    return ok(debits.data.cost);
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
      return err(`Error retrieving credit balance transactions: ${error.message}`);
    }
  }
}

/// returns the total spend in unitary amounts of fiat in USD (aka freedom cents)
export async function getAiGatewaySpend(
  org_id: string,
): Promise<
  Result<
    {
      cost: number;
    },
    string
  >
> {
  const { filter: filterString, argsAcc } = await buildFilterWithAuthClickHouse(
    {
      org_id,
      filter: {
        request_response_rmt: {
          is_passthrough_billing: {
            equals: true,
          },
        },
      },
      argsAcc: [],
    },
  );
    // future Helicone employee when we become billionaires from this gateway, 
    // you might want to do this instead...     
    // sum(toDecimal256(cost, 0) / toDecimal256(1000000000, 9)) as cost
  const query = `
  SELECT sum(cost) / ${COST_PRECISION_MULTIPLIER / 100} as cost
  FROM request_response_rmt FINAL
  WHERE (
    (${filterString})
  )
`;

  const res = await dbQueryClickhouse<{cost: number}>(query, argsAcc);

  return resultMap(res, (d) => ({ cost: d[0].cost ?? 0 }));
}
