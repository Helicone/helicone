import { DurableObject } from "cloudflare:workers";
import { err, ok, Result } from "../util/results";

// 10^10 is the scale factor for the balance
// (which is sent to us by stripe in cents)
// NOTE:  this is off by 10x what our `COST_PRECISION_MULTIPLIER` is in JAWN
export const SCALE_FACTOR = 10_000_000_000;

// minimum wallet balance to start an escrow: 1 cent, scaled
const MINIMUM_RESERVE = 1 * SCALE_FACTOR;

export const SYNC_STALENESS_THRESHOLD = 60_000; // 1min
export const ALERT_THRESHOLD = 10; // $0.10, 10cents
export const ALERT_ID = "total_spend_delta_alert";

export interface WalletState {
  // totalCredits - totalDebits
  balance: number;
  // balance - totalEscrow
  effectiveBalance: number;
  // sum of escrows for in-flight requests
  totalEscrow: number;
  // totalDebits, ie all the token usage from aggregated_debits table
  totalDebits: number;
  // totalCredits, ie all the purchases from stripe
  totalCredits: number;
  // list of requests that we were unable to parse the cost from and therefore were unable to record token usage for
  disallowList: (DisallowListEntry & { helicone_request_id: string })[];
}

export interface PurchasedCredits {
  id: string;
  createdAt: number;
  credits: number;
  // ie the stripe_payment_intent_id
  referenceId: string;
}

export interface PaginatedPurchasedCredits {
  purchases: PurchasedCredits[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DisallowListEntry {
  provider: string;
  model: string;
}

export interface Escrow {
  id: string;
  // amount in USD unit amounts (cents)
  amount: number;
  createdAt: number;
  requestId: string;
}

export interface TotalCreditsPurchased {
  totalCredits: number;
}

export class Wallet extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.initializeTable();
  }

  private initializeTable(): void {
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS processed_webhook_events (
        id TEXT PRIMARY KEY,
        processed_at INTEGER NOT NULL
      );
      -- used to prevent scenarios where we are able to record
      -- token usage, eg, we are unable to parse the response body
      -- and extract the tokens used.
      CREATE TABLE IF NOT EXISTS disallow_list (
        helicone_request_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        PRIMARY KEY (provider, model)
      );
      -- Escrows for pre-authorization of requests
      CREATE TABLE IF NOT EXISTS escrows (
        id TEXT PRIMARY KEY,
        amount INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        request_id TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS credit_purchases (
        id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        -- eg credits purchased from stripe
        credits INTEGER NOT NULL,
        -- ie the stripe_payment_intent_id
        reference_id TEXT NOT NULL
      );
      -- Tracks accumulated pass through billing credits spent (ie debits) per organization with reconciliation data.
      -- This table serves as the worker's working copy of total pass through billing credits spent by each org,
      -- aggregating actual token usage costs from all requests. It includes reconciliation
      -- fields to sync with ClickHouse analytics DB (the source of truth) and detect billing discrepancies.
      -- 
      -- this is basically a struct with one row that has the total amount of pass through billing credits SPENT by an org.
      -- since we need to have a primary key, we are just re-using the org id even though the wallet is already scoped to an org.
      CREATE TABLE IF NOT EXISTS aggregated_debits (
        org_id     TEXT PRIMARY KEY,
        debits INTEGER NOT NULL DEFAULT 0,           -- Total spending in scaled cents (SCALE_FACTOR)
        updated_at  INTEGER NOT NULL,                -- Last time debits were updated
        -- Reconciliation fields for ClickHouse sync (the source of truth):
        ch_last_checked_at INTEGER NOT NULL,         -- When we last fetched total from ClickHouse  
        ch_last_value INTEGER NOT NULL DEFAULT 0     -- Last known ClickHouse total for comparison
      );
      CREATE TABLE IF NOT EXISTS alert_state (
        id TEXT PRIMARY KEY,
        -- boolean would also work but sqlite uses ints for booleans and then it gets messy
        state TEXT NOT NULL DEFAULT 'off',
        created_at INTEGER NOT NULL
      );
    `);
  }

  addToDisallowList(
    heliconeRequestId: string,
    provider: string,
    model: string
  ): void {
    this.ctx.storage.sql.exec(
      "INSERT INTO disallow_list (helicone_request_id, created_at, provider, model) VALUES (?, ?, ?, ?)",
      heliconeRequestId,
      Date.now(),
      provider,
      model
    );
  }

  getDisallowList(): DisallowListEntry[] {
    const result = this.ctx.storage.sql
      .exec<{
        provider: string;
        model: string;
      }>("SELECT provider, model FROM disallow_list")
      .toArray();

    return result;
  }

  isEventProcessed(eventId: string): boolean {
    const count = this.ctx.storage.sql.exec<{count: number}>(
      "SELECT COALESCE(count(*), 0) as count FROM processed_webhook_events WHERE id = ?", eventId
    ).one().count;
    return count > 0;
  }

  addCredits(amount: number, eventId: string): void {
    const scaledAmount = amount * SCALE_FACTOR;
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec(
        "INSERT INTO credit_purchases (id, created_at, credits, reference_id) VALUES (?, ?, ?, ?)",
        crypto.randomUUID(),
        Date.now(),
        scaledAmount,
        eventId
      );
      this.ctx.storage.sql.exec("INSERT INTO processed_webhook_events (id, processed_at) VALUES (?, ?)", eventId, Date.now());
    });
  }

  setCredits(amount: number, eventId: string): void {
    if (this.env.ENVIRONMENT !== "development") {
      return;
    }
    const scaledAmount = amount * SCALE_FACTOR;
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec("DELETE FROM credit_purchases");
      this.ctx.storage.sql.exec(
        "INSERT INTO credit_purchases (id, created_at, credits, reference_id) VALUES (?, ?, ?, ?)",
        crypto.randomUUID(),
        Date.now(),
        scaledAmount,
        eventId
      );
      this.ctx.storage.sql.exec("INSERT INTO processed_webhook_events (id, processed_at) VALUES (?, ?)", eventId, Date.now());
    });
  }

  getTotalCreditsPurchased(): TotalCreditsPurchased {
    const result = this.ctx.storage.sql.exec<{ totalCredits: number }>(
      "SELECT COALESCE(SUM(credits), 0) as totalCredits FROM credit_purchases"
    ).one().totalCredits;
    return { totalCredits: result / SCALE_FACTOR };
  }

  getTotalDebits(orgId: string): { totalDebits: number, alertState: boolean } {
    return this.ctx.storage.transactionSync(() => {
      const debits = this.ctx.storage.sql
        .exec<{ total: number }>("SELECT COALESCE(SUM(debits), 0) as total FROM aggregated_debits WHERE org_id = ?", orgId)
        .one()
        .total;
      
      const alertState = this.ctx.storage.sql
        // `state: number` is correct here because this is how sqlit stores the boolean internally
        .exec<{ state: string }>("SELECT state FROM alert_state WHERE id = ?", ALERT_ID)
        .next()
        ?.value?.state === "on";

      return {
        totalDebits: debits / SCALE_FACTOR,
        alertState,
      } as { totalDebits: number, alertState: boolean };
    });
  }

  setAlertState(id: string, state: boolean): void {
    this.ctx.storage.sql.exec("INSERT INTO alert_state (id, state, created_at) VALUES (?, ?, ?)", id, state ? "on" : "off", Date.now());
  }

  getWalletState(orgId: string): WalletState {
    return this.ctx.storage.transactionSync(() => {
      const disallowList = this.ctx.storage.sql
        .exec<{
          helicone_request_id: string;
          provider: string;
          model: string;
        }>(
          "SELECT helicone_request_id, provider, model FROM disallow_list"
        )
        .toArray();

      const escrowSum = this.ctx.storage.sql
        .exec<{ total: number }>("SELECT COALESCE(SUM(amount), 0) as total FROM escrows")
        .one()
        .total;

      const debits = this.ctx.storage.sql
        .exec<{ total: number }>("SELECT COALESCE(SUM(debits), 0) as total FROM aggregated_debits WHERE org_id = ?", orgId)
        .one()
        .total;
      
      const totalCreditsPurchased = this.ctx.storage.sql
        .exec<{ totalCreditsPurchased: number }>(
          "SELECT COALESCE(SUM(credits), 0) as totalCreditsPurchased FROM credit_purchases",
        )
        .one()
        .totalCreditsPurchased;

      const balance = totalCreditsPurchased - debits;
      return {
        balance: balance / SCALE_FACTOR,
        effectiveBalance: (balance - escrowSum) / SCALE_FACTOR,
        totalEscrow: escrowSum / SCALE_FACTOR,
        totalDebits: debits / SCALE_FACTOR,
        totalCredits: totalCreditsPurchased / SCALE_FACTOR,
        disallowList,
      } as WalletState;
    });
  }

  reserveCostInEscrow(
    orgId: string,
    requestId: string,
    amountToReserve: number
  ): Result<{ escrowId: string }, { statusCode: number, message: string }> {
    const amountToReserveScaled = amountToReserve * SCALE_FACTOR;
    return this.ctx.storage.transactionSync(() => {
      const totalCreditsPurchased = this.ctx.storage.sql
        .exec<{ total: number }>("SELECT COALESCE(SUM(credits), 0) as total FROM credit_purchases")
        .one()
        .total;

      const totalEscrow = this.ctx.storage.sql
        .exec<{ total: number }>("SELECT COALESCE(SUM(amount), 0) as total FROM escrows")
        .one()
        .total;

      const totalDebits = this.ctx.storage.sql
        .exec<{ total: number }>("SELECT COALESCE(SUM(debits), 0) as total FROM aggregated_debits WHERE org_id = ?", orgId)
        .one()
        .total;
      const availableBalance = totalCreditsPurchased - totalEscrow - totalDebits;

      if (availableBalance - amountToReserveScaled < MINIMUM_RESERVE) {
        const availableScaled = availableBalance / SCALE_FACTOR;
        const neededScaled = amountToReserve + (MINIMUM_RESERVE / SCALE_FACTOR);
        return err({
          statusCode: 429,
          message: `Insufficient balance for escrow. Available: ${availableScaled} cents, needed: ${neededScaled} cents`
        } as { statusCode: number, message: string });
      }

      // we don't want to re-use the official Helicone request id (at least, not by itself),
      // since we also support users specifying that id, which would allow them to circumvent
      // escrow if they re-supply old request ids.
      const escrowId = crypto.randomUUID();
      this.ctx.storage.sql.exec(
        "INSERT INTO escrows (id, amount, created_at, request_id) VALUES (?, ?, ?, ?)",
        escrowId,
        amountToReserveScaled,
        Date.now(),
        requestId
      );

      return ok({ escrowId });
    });
  }

  finalizeEscrow(
    orgId: string,
    escrowId: string,
    actualCost: number
  ): { clickhouseLastCheckedAt: number } {
    const actualCostScaled = actualCost * SCALE_FACTOR;
    return this.ctx.storage.transactionSync(() => {
      const now = Date.now();
      this.ctx.storage.sql.exec(
        `INSERT INTO aggregated_debits (org_id, debits, updated_at, ch_last_checked_at, ch_last_value) 
          VALUES (?, ?, ?, ?, ?) 
          ON CONFLICT(org_id) DO UPDATE 
          SET debits = aggregated_debits.debits + excluded.debits, updated_at = ?`,
        orgId,
        actualCostScaled,
        now,
        now,
        0,
        now
      );
      this.ctx.storage.sql.exec("DELETE FROM escrows WHERE id = ?", escrowId);
      const result = this.ctx.storage.sql
        .exec<{ checked_at: number }>("SELECT ch_last_checked_at as checked_at FROM aggregated_debits WHERE org_id = ?", orgId)
        .one();
      return { clickhouseLastCheckedAt: result.checked_at };
    });
  }

  cancelEscrow(escrowId: string): void {
    this.ctx.storage.sql.exec(
      "DELETE FROM escrows WHERE id = ?",
      escrowId
    );
  }

  updateClickhouseValues(
    orgId: string,
    clickhouseValue: number
  ): void {
    const scaledValue = clickhouseValue * SCALE_FACTOR;
    const now = Date.now();
    this.ctx.storage.sql.exec(
      `UPDATE aggregated_debits 
       SET ch_last_checked_at = ?, ch_last_value = ?
       WHERE org_id = ?`,
      now,
      scaledValue,
      orgId
    );
  }
}
