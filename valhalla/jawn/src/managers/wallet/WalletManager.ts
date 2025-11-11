import { ENVIRONMENT } from "../../lib/clients/constant";
import { err, ok, Result } from "../../packages/common/result";
import { WalletState } from "../../types/wallet";

const WORKER_API_URL =
  process.env.HELICONE_WORKER_API ||
  process.env.WORKER_API_URL ||
  "https://api.worker.helicone.ai";

const ADMIN_ACCESS_KEY = process.env.HELICONE_MANUAL_ACCESS_KEY;

export class WalletManager {
  constructor(private orgId: string) {
    if (!ADMIN_ACCESS_KEY) {
      throw new Error("Admin access key not configured");
    }
  }

  public async getWalletState(): Promise<Result<WalletState, string>> {
    try {
      // Use the admin endpoint that can query any org's wallet
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        `${WORKER_API_URL}/admin/wallet/${this.orgId}/state`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${ADMIN_ACCESS_KEY}`,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return err(`Failed to fetch wallet state: ${errorText}`);
      }

      const walletState = await response.json();

      // Convert values from cents to dollars
      const convertedWalletState: WalletState = {
        balance: (walletState.balance || 0) / 100,
        effectiveBalance: (walletState.effectiveBalance || 0) / 100,
        totalCredits: (walletState.totalCredits || 0) / 100,
        totalDebits: (walletState.totalDebits || 0) / 100,
        totalEscrow: (walletState.totalEscrow || 0) / 100,
        disallowList: walletState.disallowList || [],
      };

      return ok(convertedWalletState);
    } catch (error) {
      console.error("Error fetching wallet state:", error);

      // Fallback for local development when Durable Objects don't work
      if (ENVIRONMENT !== "production") {
        console.warn("Using fallback wallet state for local development");
        const fallbackState: WalletState = {
          balance: 0,
          effectiveBalance: 0,
          totalCredits: 0,
          totalDebits: 0,
          totalEscrow: 0,
          disallowList: [],
        };
        return ok(fallbackState);
      }

      return err(`Error fetching wallet state: ${error}`);
    }
  }
}
