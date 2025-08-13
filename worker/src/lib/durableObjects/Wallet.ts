import { DurableObject } from "cloudflare:workers";
import { err, ok, Result } from "../util/results";

// 10^10 is the scale factor for the balance 
// (which is sent to us by stripe in cents)
const SCALE_FACTOR = 10_000_000_000;

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
      CREATE TABLE IF NOT EXISTS inflight_requests (
        id TEXT PRIMARY KEY,
        requested_at INTEGER NOT NULL
      );
    `);
  }

  getBalance(orgId: string): number {
    const result = this.ctx.storage.sql
      .exec<{
        balance: number;
      }>("SELECT credits FROM wallet WHERE orgId = ?", orgId)
      .one();

    return result?.balance ?? 0;
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
          `INSERT INTO wallet (balance) 
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

  getInflightRequestCount(): number {
    const result = this.ctx.storage.sql.exec<{ count: number }>(
      "SELECT COUNT(*) as count FROM inflight_requests"
    ).one();
    
    return result?.count ?? 0;
  }

  addInflightRequest(requestId: string): Result<void, string> {
    const result = this.ctx.storage.sql.exec(
      "INSERT INTO inflight_requests (id, requested_at) VALUES (?, ?) ON CONFLICT(id) DO NOTHING",
      requestId,
      Date.now()
    );
    
    if (result.rowsWritten === 0) {
      return err(`Request ${requestId} already exists`);
    }
    
    return ok(undefined);
  }

  removeInflightRequest(requestId: string): Result<void, string> {
    const result = this.ctx.storage.sql.exec(
      "DELETE FROM inflight_requests WHERE id = ?",
      requestId
    );
    
    if (result.rowsWritten === 0) {
      return err(`Request ${requestId} not found`);
    }
    
    return ok(undefined);
  }

  getBalanceAndInflightCount(orgId: string): { balance?: number; inflightCount: number } {
    return this.ctx.storage.transactionSync(() => {
      const balanceResult = this.ctx.storage.sql
        .exec<{ balance: number }>("SELECT balance FROM wallet WHERE orgId = ?", orgId)
        .next();
      
      const inflightResult = this.ctx.storage.sql
        .exec<{ count: number }>("SELECT COUNT(*) as count FROM inflight_requests")
        .one();
      
      return {
        balance: balanceResult.done ? undefined : balanceResult.value.balance,
        inflightCount: inflightResult?.count ?? 0
      };
    });
  }
}
