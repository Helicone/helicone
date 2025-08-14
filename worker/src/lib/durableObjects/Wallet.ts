import { DurableObject } from "cloudflare:workers";
import { err, ok, Result } from "../util/results";

// 10^10 is the scale factor for the balance 
// (which is sent to us by stripe in cents)
export const SCALE_FACTOR = 10_000_000_000;

// lookback period to rate limit users for
// unknown costs. 30 seconds in milliseconds
const UNKNOWN_COST_WINDOW_MS = 30 * 1000;

export interface WalletState {
  // USD cents * SCALED_FACTOR
  balance: number;
  // number of requests in flight
  inflightCount: number;
  // number of requests with unknown cost due to
  // not being able to parse the cost from the response
  unknownCostCount: number;
}

export class Wallet extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.initializeTable();
  }

  private initializeTable(): void {
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS wallet (
        orgId TEXT PRIMARY KEY,
        balance INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS processed_webhook_events (
        id TEXT PRIMARY KEY,
        processed_at INTEGER NOT NULL
      );
      -- used to gate/limit the user from making too many requests
      -- via abusive spam that overspends their credits
      CREATE TABLE IF NOT EXISTS inflight_requests (
        id TEXT PRIMARY KEY,
        requested_at INTEGER NOT NULL
      );
      -- used to gate/limit the user from making too many requests
      -- when we cant parse the cost from the response.
      -- we could potentially truncate this table everytime we sync
      -- the durable object balance with stripe
      CREATE TABLE IF NOT EXISTS unknown_costs (
        helicone_request_id TEXT PRIMARY KEY,
        requested_at INTEGER NOT NULL
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

  deductBalance(orgId: string, amount: number): Result<void, string> {
    try {
      if (amount <= 0) {
        return err("Amount must be positive");
      }

      this.ctx.storage.transactionSync(() => {
        const scaledAmount = amount * SCALE_FACTOR;
        const result = this.ctx.storage.sql.exec(
          "UPDATE wallet SET balance = balance - ? WHERE orgId = ?",
          scaledAmount,
          orgId
        );

        if (result.rowsWritten === 0) {
          throw new Error(`Failed to update balance for org ${orgId}`);
        }
      });

      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error.message : "Unknown error");
    }
  }

  addInflightRequest(requestId: string): Result<void, string> {
    try {
      const result = this.ctx.storage.sql.exec(
        "INSERT INTO inflight_requests (id, requested_at) VALUES (?, ?) ON CONFLICT(id) DO NOTHING",
        requestId,
        Date.now()
      );
      
      if (result.rowsWritten === 0) {
        return err(`Request ${requestId} already exists`);
      }
      
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error.message : "Unknown error");
    }
  }

  removeInflightRequest(requestId: string): Result<void, string> {
    try {
      const result = this.ctx.storage.sql.exec(
        "DELETE FROM inflight_requests WHERE id = ?",
        requestId
      );
      
      if (result.rowsWritten === 0) {
        return err(`Request ${requestId} not found`);
      }
      
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error.message : "Unknown error");
    }
  }

  addUnknownCost(heliconeRequestId: string): Result<void, string> {
    try {
      const result = this.ctx.storage.sql.exec(
        "INSERT INTO unknown_costs (helicone_request_id, requested_at) VALUES (?, ?) ON CONFLICT(helicone_request_id) DO NOTHING",
        heliconeRequestId,
        Date.now()
      );

      if (result.rowsWritten === 0) {
        return err(`Unknown cost entry ${heliconeRequestId} already exists`);
      }

      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error.message : "Unknown error");
    }
  }

  getWalletState(orgId: string): WalletState {
    try {
      return this.ctx.storage.transactionSync(() => {
        const balanceResult = this.ctx.storage.sql
          .exec<{ balance: number }>("SELECT balance FROM wallet WHERE orgId = ?", orgId)
          .next();
        
        const inflightResult = this.ctx.storage.sql
          .exec<{ count: number }>("SELECT COUNT(*) as count FROM inflight_requests")
          .one();
        
        const unknownCostResult = this.ctx.storage.sql
          .exec<{ count: number }>("SELECT COUNT(*) as count FROM unknown_costs WHERE requested_at > ?", Date.now() - UNKNOWN_COST_WINDOW_MS)
          .one();

        return {
          balance: balanceResult.value?.balance ?? 0,
          inflightCount: inflightResult?.count ?? 0,
          unknownCostCount: unknownCostResult?.count ?? 0
        };
      });
    } catch (_error) {
      return {
        balance: 0,
        inflightCount: 0,
        unknownCostCount: 0,
      };
    }
  }
}
