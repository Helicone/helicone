import { err, ok, Result } from "../../../../packages/common/result";
import {
  CreditBalanceResponse,
  PaginatedPurchasedCredits,
} from "../controllers/public/creditsController";
import { AuthParams } from "../packages/common/auth/types";
import { isError } from "../packages/common/result";
import { BaseManager } from "./BaseManager";
import { WalletManager } from "./wallet/WalletManager";

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
}
