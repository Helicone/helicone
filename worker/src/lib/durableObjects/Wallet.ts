import { DurableObject } from "cloudflare:workers";
import { err, ok, Result } from "../util/results";
import { StripeManager } from "../managers/StripeManager";
import { createClient } from "@supabase/supabase-js";

// 10^10 is the scale factor for the balance
// (which is sent to us by stripe in cents)
export const SCALE_FACTOR = 10_000_000_000;

// Escrow expiry period - 5 minutes
const ESCROW_EXPIRY_MS = 5 * 60 * 1000;
// minimum wallet balance to start an escrow: 5 cents, scaled
const MINIMUM_RESERVE = 5 * SCALE_FACTOR;
// 30 seconds in milliseconds
const BALANCE_CHECK_THRESHOLD_MS = 30 * 1000;

export interface WalletState {
  // local balance in USD cents
  balance: number;
  // sum of escrows for in-flight requests (in USD cents)
  totalEscrow: number;
  // list of requests that we were unable to parse the cost from and therefore were unable to record token usage for
  disallowList: DisallowListEntry[];
}

export interface DisallowListEntry {
  id: string;
  helicone_request_id: string;
  provider: string | null;
  model: string | null;
}

export interface Escrow {
  id: string;
  // amount in USD cents
  amount: number;
  createdAt: number;
  requestId: string;
}

export class Wallet extends DurableObject {
  private stripeManager: StripeManager;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.initializeTable();
    this.stripeManager = new StripeManager(
      env.STRIPE_WEBHOOK_SECRET,
      env.STRIPE_SECRET_KEY,
      env.WALLET,
      createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
    );
  }

  private initializeTable(): void {
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS wallet (
        orgId TEXT PRIMARY KEY,
        balance INTEGER NOT NULL DEFAULT 0,
        last_checked_at INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS processed_webhook_events (
        id TEXT PRIMARY KEY,
        processed_at INTEGER NOT NULL
      );
      -- used to prevent scenarios where we are able to record
      -- token usage, eg, we are unable to parse the response body
      -- and extract the tokens used.
      CREATE TABLE IF NOT EXISTS disallow_list (
        id TEXT PRIMARY KEY,
        helicone_request_id TEXT NOT NULL,
        requested_at INTEGER NOT NULL,
        provider TEXT,
        model TEXT
      );
      -- Escrows for pre-authorization of requests
      CREATE TABLE IF NOT EXISTS escrows (
        id TEXT PRIMARY KEY,
        amount INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        request_id TEXT NOT NULL
      );
    `);
  }

  addBalance(
    orgId: string,
    amount: number,
    eventId: string
  ): Result<void, string> {
    try {
      this.ctx.storage.transactionSync(() => {
        const processed = this.ctx.storage.sql.exec(
          "INSERT INTO processed_webhook_events (id, processed_at) VALUES (?, ?) ON CONFLICT(id) DO NOTHING",
          eventId,
          Date.now()
        );
        if (processed.rowsWritten === 0) {
          throw new Error(`Event ${eventId} already processed`);
        }

        const scaledAmount = amount * SCALE_FACTOR;
        const updatedBalance = this.ctx.storage.sql.exec(
          `INSERT INTO wallet (orgId, balance) 
          VALUES (?, ?)
          ON CONFLICT(orgId) 
          DO UPDATE SET balance = balance + excluded.balance`,
          orgId,
          scaledAmount
        );

        if (updatedBalance.rowsWritten === 0) {
          throw new Error(`Failed to update balance for org ${orgId}`);
        }
      });
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error.message : "Unknown error");
    }
  }

  addToDisallowList(
    heliconeRequestId: string,
    provider?: string,
    model?: string
  ): Result<void, string> {
    try {
      const result = this.ctx.storage.sql.exec(
        "INSERT INTO disallow_list (id, helicone_request_id, requested_at, provider, model) VALUES (?, ?, ?, ?, ?)",
        crypto.randomUUID(),
        heliconeRequestId,
        Date.now(),
        provider,
        model
      );

      if (result.rowsWritten === 0) {
        return err("Unable to add to disallow list");
      }

      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error.message : "Unknown error");
    }
  }

  getDisallowList(): Result<DisallowListEntry[], string> {
    try {
      const result = this.ctx.storage.sql
        .exec<{
          id: string;
          helicone_request_id: string;
          provider: string | null;
          model: string | null;
        }>("SELECT id, helicone_request_id, provider, model FROM disallow_list")
        .toArray();

      return ok(result);
    } catch (error) {
      return err(error instanceof Error ? error.message : "Unknown error");
    }
  }

  getWalletState(orgId: string): Result<WalletState, string> {
    try {
      return this.ctx.storage.transactionSync(() => {
        const balance = this.ctx.storage.sql
          .exec<{
            balance: number;
          }>("SELECT balance FROM wallet WHERE orgId = ?", orgId)
          .one().balance;

        const disallowList = this.ctx.storage.sql
          .exec<{
            id: string;
            helicone_request_id: string;
            provider: string | null;
            model: string | null;
          }>(
            "SELECT id, helicone_request_id, provider, model FROM disallow_list"
          )
          .toArray();

        const escrowResult = this.ctx.storage.sql
          .exec<{ total: number }>("SELECT SUM(amount) as total FROM escrows")
          .next();

        const escrowSum = escrowResult.value?.total ?? 0;

        return ok({
          balance: balance / SCALE_FACTOR,
          totalEscrow: escrowSum / SCALE_FACTOR,
          disallowList,
        });
      });
    } catch (error) {
      return err(error instanceof Error ? error.message : "Unknown error");
    }
  }

  reserveCostInEscrow(
    orgId: string,
    requestId: string,
    amountToReserve: number
  ): Result<{ escrowId: string }, string> {
    const amountToReserveScaled = amountToReserve * SCALE_FACTOR;
    try {
      return this.ctx.storage.transactionSync(() => {
        const balance = this.ctx.storage.sql
          .exec<{
            balance: number;
          }>("SELECT balance FROM wallet WHERE orgId = ?", orgId)
          .one().balance;

        const escrowResult = this.ctx.storage.sql
          .exec<{ total: number }>("SELECT SUM(amount) as total FROM escrows")
          .next();

        const escrowSum = escrowResult.value?.total ?? 0;

        if (balance - escrowSum - amountToReserveScaled < MINIMUM_RESERVE) {
          return err(
            `Insufficient balance for escrow. Available: ${(balance - escrowSum) / SCALE_FACTOR} cents, needed: ${amountToReserve} cents`
          );
        }

        const escrowId = crypto.randomUUID();
        // we don't want to re-use the official Helicone request id (at least, not by itself),
        // since we also support users specifying that id, which would allow them to circumvent
        // escrow if they re-supply old request ids.
        this.ctx.storage.sql.exec(
          "INSERT INTO escrows (id, amount, created_at, request_id) VALUES (?, ?, ?, ?)",
          escrowId,
          amountToReserveScaled,
          Date.now(),
          requestId
        );

        return ok({ escrowId });
      });
    } catch (error) {
      return err(error instanceof Error ? error.message : "Unknown error");
    }
  }

  finalizeEscrow(
    orgId: string,
    escrowId: string,
    actualCost: number
  ): Result<void, string> {
    const actualCostScaled = actualCost * SCALE_FACTOR;
    try {
      return this.ctx.storage.transactionSync(() => {
        this.ctx.storage.sql.exec(
          "UPDATE wallet SET balance = balance - ? WHERE orgId = ?",
          actualCostScaled,
          orgId
        );
        this.ctx.storage.sql.exec("DELETE FROM escrows WHERE id = ?", escrowId);

        return ok(undefined);
      });
    } catch (error) {
      return err(error instanceof Error ? error.message : "Unknown error");
    }
  }

  cancelEscrow(escrowId: string): Result<void, string> {
    try {
      const result = this.ctx.storage.sql.exec(
        "DELETE FROM escrows WHERE id = ?",
        escrowId
      );

      if (result.rowsWritten === 0) {
        return err(`Escrow ${escrowId} not found`);
      }

      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error.message : "Unknown error");
    }
  }

  cleanupExpiredEscrows(): Result<number, string> {
    try {
      const result = this.ctx.storage.sql.exec(
        "DELETE FROM escrows WHERE created_at < ?",
        Date.now() - ESCROW_EXPIRY_MS
      );
      return ok(result.rowsWritten ?? 0);
    } catch (error) {
      return err(error instanceof Error ? error.message : "Unknown error");
    }
  }

  async updateBalanceIfNeeded(
    orgId: string,
    stripeCustomerId: string,
  ): Promise<Result<void, string>> {
    try {
      return await this.ctx.storage.transactionSync(async () => {
        const lastCheckedAt =
          this.ctx.storage.sql
            .exec<{
              last_checked_at: number | null;
            }>("SELECT last_checked_at FROM wallet WHERE orgId = ?", orgId)
            .one().last_checked_at ?? 0;

        const timeSinceLastCheck = Date.now() - lastCheckedAt;

        if (timeSinceLastCheck > BALANCE_CHECK_THRESHOLD_MS) {
          const balanceResult =
            await this.stripeManager.getCreditBalanceWithRetry(stripeCustomerId);

          if (balanceResult.data) {
            const scaledBalance = balanceResult.data.balance * SCALE_FACTOR;
            this.ctx.storage.sql.exec(
              "UPDATE wallet SET balance = ?, last_checked_at = ? WHERE orgId = ?",
              scaledBalance,
              Date.now(),
              orgId
            );
          } else {
            console.error(
              `Failed to get balance from Stripe for org ${orgId}:`,
              balanceResult.error
            );
            // TODO: add alerts
          }
        }

        return ok(undefined);
      });
    } catch (error) {
      return err(error instanceof Error ? error.message : "Unknown error");
    }
  }
}
