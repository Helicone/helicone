/**
 * Wallet helper functions for E2E tests
 */

import axios, { AxiosResponse } from "axios";
import { WORKER_API_URL } from "./constants";
import { randomUUID } from "crypto";

// Admin access key from worker/wrangler.toml (local development only)
// This matches HELICONE_MANUAL_ACCESS_KEY in the worker config
const HELICONE_MANUAL_ACCESS_KEY =
  "sk-helicone-rrrrrrr-xxxxxxx-vvvvvvv-wwwwwww";

export interface WalletState {
  effectiveBalance: number;
  totalCredits: number;
  totalDebits: number;
  creditPurchases: any[];
  aggregatedDebits: any[];
  escrows: any[];
  disallowList: any[];
}

export interface AddCreditsOptions {
  orgId: string;
  amount: number;
  reason?: string;
  referenceId?: string;
  adminUserId?: string;
}

/**
 * Add credits to a wallet for testing purposes
 */
export async function addCreditsToWallet(
  options: AddCreditsOptions
): Promise<AxiosResponse<WalletState>> {
  const {
    orgId,
    amount,
    reason = "E2E test credits",
    referenceId = `e2e-test-${randomUUID()}`,
    adminUserId = "e2e-test-admin",
  } = options;

  return axios.post<WalletState>(
    `${WORKER_API_URL}/admin/wallet/${orgId}/modify-balance`,
    {
      amount,
      type: "credit",
      reason,
      referenceId,
      adminUserId,
    },
    {
      headers: {
        Authorization: `Bearer ${HELICONE_MANUAL_ACCESS_KEY}`,
        "Content-Type": "application/json",
      },
      validateStatus: () => true,
    }
  );
}

/**
 * Deduct credits from a wallet for testing purposes
 */
export async function deductCreditsFromWallet(
  options: AddCreditsOptions
): Promise<AxiosResponse<WalletState>> {
  const {
    orgId,
    amount,
    reason = "E2E test debit",
    referenceId = `e2e-test-${randomUUID()}`,
    adminUserId = "e2e-test-admin",
  } = options;

  return axios.post<WalletState>(
    `${WORKER_API_URL}/admin/wallet/${orgId}/modify-balance`,
    {
      amount,
      type: "debit",
      reason,
      referenceId,
      adminUserId,
    },
    {
      headers: {
        Authorization: `Bearer ${HELICONE_MANUAL_ACCESS_KEY}`,
        "Content-Type": "application/json",
      },
      validateStatus: () => true,
    }
  );
}

/**
 * Get wallet state for an organization
 */
export async function getWalletState(
  orgId: string
): Promise<AxiosResponse<WalletState>> {
  return axios.get<WalletState>(
    `${WORKER_API_URL}/admin/wallet/${orgId}/state`,
    {
      headers: {
        Authorization: `Bearer ${HELICONE_MANUAL_ACCESS_KEY}`,
      },
      validateStatus: () => true,
    }
  );
}

/**
 * Get total credits purchased for an organization
 */
export async function getTotalCreditsPurchased(
  orgId: string
): Promise<AxiosResponse<{ totalCredits: number }>> {
  return axios.get<{ totalCredits: number }>(
    `${WORKER_API_URL}/wallet/credits/total?orgId=${orgId}`,
    {
      headers: {
        Authorization: `Bearer ${HELICONE_MANUAL_ACCESS_KEY}`,
      },
      validateStatus: () => true,
    }
  );
}

/**
 * Reset wallet credits to 0 by deducting the current balance
 */
export async function resetWalletCredits(
  orgId: string
): Promise<AxiosResponse<WalletState>> {
  // First get the current wallet state
  const stateResponse = await getWalletState(orgId);

  if (stateResponse.status !== 200 || !stateResponse.data) {
    throw new Error(
      `Failed to get wallet state: ${stateResponse.status} ${stateResponse.statusText}`
    );
  }

  const currentBalance = stateResponse.data.effectiveBalance;

  // If balance is already 0 or negative, nothing to do
  if (currentBalance <= 0) {
    return stateResponse;
  }

  // Deduct the current balance to set it to 0
  return deductCreditsFromWallet({
    orgId,
    amount: currentBalance,
    reason: "E2E test - reset wallet to 0",
    referenceId: `e2e-reset-${randomUUID()}`,
  });
}
