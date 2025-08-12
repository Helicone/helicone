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
    `);
  }

  getBalance(orgId: string): number {
    const result = this.ctx.storage.sql
      .exec<{
        balance: number;
      }>("SELECT balance FROM wallet WHERE orgId = ?", orgId)
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
}
