import { DurableObject } from "cloudflare:workers";
import { err, ok, Result } from "../util/results";
import Stripe from "stripe";

// 10^10 is the scale factor for the balance
// (which is sent to us by stripe in cents)
// NOTE:  this is off by 10x what our `COST_PRECISION_MULTIPLIER` is in JAWN
export const SCALE_FACTOR = 10_000_000_000;

// minimum wallet balance to start an escrow: 1 cent, scaled
const MINIMUM_RESERVE = 1 * SCALE_FACTOR;

export const SYNC_STALENESS_THRESHOLD = 60_000; // 1min
export const ALERT_THRESHOLD = 10; // $0.10, 10cents
export const ALERT_ID = "total_spend_delta_alert";

// Alert state constants
export const ALERT_STATE_ON = "on";
export const ALERT_STATE_OFF = "off";

// Stripe dispute status values that indicate an unresolved/active dispute
// These are the official Stripe dispute status values for active disputes
const UNRESOLVED_DISPUTE_STATUSES: Stripe.Dispute.Status[] = [
  "needs_response",
  "under_review",
  "warning_needs_response",
  "warning_under_review",
];

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
  // wallet dispute status
  disputeStatus: DisputeStatus;
  // active disputes
  activeDisputes: Dispute[];
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

export interface Dispute {
  id: string;
  chargeId: string;
  amount: number;
  currency: string;
  reason: string;
  status: Stripe.Dispute.Status;
  createdAt: number;
  eventId: string;
}

export enum DisputeStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  RESOLVED = "resolved",
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
        state TEXT NOT NULL DEFAULT '${ALERT_STATE_OFF}',
        created_at INTEGER NOT NULL
      );
      -- Tracks disputes 
      CREATE TABLE IF NOT EXISTS disputes (
        id TEXT PRIMARY KEY,
        charge_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        event_id TEXT NOT NULL UNIQUE
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

  removeFromDisallowList(provider: string, model: string): void {
    this.ctx.storage.sql.exec(
      "DELETE FROM disallow_list WHERE provider = ? AND model = ?",
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
    const count = this.ctx.storage.sql
      .exec<{
        count: number;
      }>(
        "SELECT COALESCE(count(*), 0) as count FROM processed_webhook_events WHERE id = ?",
        eventId
      )
      .one().count;
    return count > 0;
  }

  // amount is in cents
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
      this.ctx.storage.sql.exec(
        "INSERT INTO processed_webhook_events (id, processed_at) VALUES (?, ?)",
        eventId,
        Date.now()
      );
    });
  }

  // amount is in cents
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
      this.ctx.storage.sql.exec(
        "INSERT INTO processed_webhook_events (id, processed_at) VALUES (?, ?)",
        eventId,
        Date.now()
      );
    });
  }

  // amount is in cents
  deductCredits(
    amount: number,
    eventId: string,
    orgId: string
  ): Result<void, string> {
    const scaledAmount = amount * SCALE_FACTOR;
    return this.ctx.storage.transactionSync(() => {
      // Get current balance and escrow
      const totalCreditsPurchased = this.ctx.storage.sql
        .exec<{
          total: number;
        }>("SELECT COALESCE(SUM(credits), 0) as total FROM credit_purchases")
        .one().total;

      const totalDebits = this.ctx.storage.sql
        .exec<{
          total: number;
        }>(
          "SELECT COALESCE(SUM(debits), 0) as total FROM aggregated_debits WHERE org_id = ?",
          orgId
        )
        .one().total;

      const escrowSum = this.ctx.storage.sql
        .exec<{
          total: number;
        }>("SELECT COALESCE(SUM(amount), 0) as total FROM escrows")
        .one().total;

      const currentBalance = totalCreditsPurchased - totalDebits;
      const effectiveBalance = currentBalance - escrowSum;

      // Check if refund amount exceeds effective balance
      if (scaledAmount > effectiveBalance) {
        const refundInCents = amount;
        const effectiveBalanceInCents = effectiveBalance / SCALE_FACTOR;
        console.error(
          `Refund amount (${refundInCents} cents) exceeds effective balance (${effectiveBalanceInCents} cents) for org ${orgId}. Rejecting refund.`
        );
        return err(
          `Refund amount exceeds effective balance. Refund: ${refundInCents} cents, Available: ${effectiveBalanceInCents} cents`
        );
      }

      // Process the refund by adding a negative credit purchase
      this.ctx.storage.sql.exec(
        "INSERT INTO credit_purchases (id, created_at, credits, reference_id) VALUES (?, ?, ?, ?)",
        crypto.randomUUID(),
        Date.now(),
        -scaledAmount, // Negative amount for refund
        eventId
      );

      this.ctx.storage.sql.exec(
        "INSERT INTO processed_webhook_events (id, processed_at) VALUES (?, ?)",
        eventId,
        Date.now()
      );

      return ok(undefined);
    });
  }

  getTotalCreditsPurchased(): TotalCreditsPurchased {
    const result = this.ctx.storage.sql
      .exec<{
        totalCredits: number;
      }>(
        "SELECT COALESCE(SUM(credits), 0) as totalCredits FROM credit_purchases"
      )
      .one().totalCredits;
    return { totalCredits: result / SCALE_FACTOR };
  }

  getTotalDebits(orgId: string): { totalDebits: number; alertState: boolean } {
    return this.ctx.storage.transactionSync(() => {
      const debits = this.ctx.storage.sql
        .exec<{
          total: number;
        }>(
          "SELECT COALESCE(SUM(debits), 0) as total FROM aggregated_debits WHERE org_id = ?",
          orgId
        )
        .one().total;

      const alertState =
        this.ctx.storage.sql
          .exec<{
            state: string;
          }>("SELECT state FROM alert_state WHERE id = ?", ALERT_ID)
          .next()?.value?.state === ALERT_STATE_ON;

      return {
        totalDebits: debits / SCALE_FACTOR,
        alertState,
      } as { totalDebits: number; alertState: boolean };
    });
  }

  setAlertState(id: string, state: boolean): void {
    this.ctx.storage.sql.exec(
      "INSERT INTO alert_state (id, state, created_at) VALUES (?, ?, ?)",
      id,
      state ? ALERT_STATE_ON : ALERT_STATE_OFF,
      Date.now()
    );
  }

  getWalletState(orgId: string): WalletState {
    return this.ctx.storage.transactionSync(() => {
      const disallowList = this.ctx.storage.sql
        .exec<{
          helicone_request_id: string;
          provider: string;
          model: string;
        }>("SELECT helicone_request_id, provider, model FROM disallow_list")
        .toArray();

      const escrowSum = this.ctx.storage.sql
        .exec<{
          total: number;
        }>("SELECT COALESCE(SUM(amount), 0) as total FROM escrows")
        .one().total;

      const debits = this.ctx.storage.sql
        .exec<{
          total: number;
        }>(
          "SELECT COALESCE(SUM(debits), 0) as total FROM aggregated_debits WHERE org_id = ?",
          orgId
        )
        .one().total;

      const totalCreditsPurchased = this.ctx.storage.sql
        .exec<{
          totalCreditsPurchased: number;
        }>(
          "SELECT COALESCE(SUM(credits), 0) as totalCreditsPurchased FROM credit_purchases"
        )
        .one().totalCreditsPurchased;

      const activeDisputesCount = this.ctx.storage.sql
        .exec<{
          count: number;
        }>(
          `SELECT COUNT(*) as count FROM disputes WHERE status IN (${UNRESOLVED_DISPUTE_STATUSES.map(() => "?").join(", ")})`,
          ...UNRESOLVED_DISPUTE_STATUSES
        )
        .one().count;

      const disputeStatus =
        activeDisputesCount > 0
          ? DisputeStatus.SUSPENDED
          : DisputeStatus.ACTIVE;
      const activeDisputes = this.ctx.storage.sql
        .exec<{
          id: string;
          charge_id: string;
          amount: number;
          currency: string;
          reason: string;
          status: Stripe.Dispute.Status;
          created_at: number;
          event_id: string;
        }>(
          `SELECT id, charge_id, amount, currency, reason, status, created_at, event_id FROM disputes WHERE status IN (${UNRESOLVED_DISPUTE_STATUSES.map(() => "?").join(", ")})`,
          ...UNRESOLVED_DISPUTE_STATUSES
        )
        .toArray()
        .map((dispute) => ({
          id: dispute.id,
          chargeId: dispute.charge_id,
          amount: dispute.amount / SCALE_FACTOR,
          currency: dispute.currency,
          reason: dispute.reason,
          status: dispute.status,
          createdAt: dispute.created_at,
          eventId: dispute.event_id,
        }));

      const balance = totalCreditsPurchased - debits;
      return {
        balance: balance / SCALE_FACTOR,
        effectiveBalance: (balance - escrowSum) / SCALE_FACTOR,
        totalEscrow: escrowSum / SCALE_FACTOR,
        totalDebits: debits / SCALE_FACTOR,
        totalCredits: totalCreditsPurchased / SCALE_FACTOR,
        disallowList,
        disputeStatus,
        activeDisputes,
      } as WalletState;
    });
  }

  reserveCostInEscrow(
    orgId: string,
    requestId: string,
    amountToReserve: number,
    creditLine: {
      limit: number; // in cents
      enabled: boolean;
    },
    dangerouslyBypassWalletCheck: boolean = false
  ): Result<{ escrowId: string }, { statusCode: number; message: string }> {
    const amountToReserveScaled = amountToReserve * SCALE_FACTOR;
    return this.ctx.storage.transactionSync(() => {
      // DANGEROUS: Bypass all wallet checks if flag is enabled
      if (dangerouslyBypassWalletCheck) {
        const escrowId = crypto.randomUUID();
        this.ctx.storage.sql.exec(
          "INSERT INTO escrows (id, amount, created_at, request_id) VALUES (?, ?, ?, ?)",
          escrowId,
          amountToReserveScaled,
          Date.now(),
          requestId
        );
        return ok({ escrowId });
      }

      // Check if wallet is suspended due to disputes
      const activeDisputesCount = this.ctx.storage.sql
        .exec<{
          count: number;
        }>(
          `SELECT COUNT(*) as count FROM disputes WHERE status IN (${UNRESOLVED_DISPUTE_STATUSES.map(() => "?").join(", ")})`,
          ...UNRESOLVED_DISPUTE_STATUSES
        )
        .one().count;

      if (activeDisputesCount > 0) {
        return err({
          statusCode: 403,
          message:
            "Wallet is suspended due to payment disputes. Please contact support.",
        } as { statusCode: number; message: string });
      }
      const totalCreditsPurchased = this.ctx.storage.sql
        .exec<{
          total: number;
        }>("SELECT COALESCE(SUM(credits), 0) as total FROM credit_purchases")
        .one().total;

      const totalEscrow = this.ctx.storage.sql
        .exec<{
          total: number;
        }>("SELECT COALESCE(SUM(amount), 0) as total FROM escrows")
        .one().total;

      const totalDebits = this.ctx.storage.sql
        .exec<{
          total: number;
        }>(
          "SELECT COALESCE(SUM(debits), 0) as total FROM aggregated_debits WHERE org_id = ?",
          orgId
        )
        .one().total;
      let availableBalance = totalCreditsPurchased - totalEscrow - totalDebits;

      if (creditLine.enabled) {
        availableBalance += creditLine.limit * SCALE_FACTOR;
      }

      if (availableBalance - amountToReserveScaled < MINIMUM_RESERVE) {
        const availableScaled = availableBalance / SCALE_FACTOR;
        const neededScaled = amountToReserve + MINIMUM_RESERVE / SCALE_FACTOR;
        return err({
          statusCode: 429,
          message: `Insufficient balance for escrow. Available: ${availableScaled} cents, needed: ${neededScaled} cents`,
        } as { statusCode: number; message: string });
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
    if (actualCostScaled < 0) {
      throw new Error("actualCost cannot be negative");
    }

    return this.ctx.storage.transactionSync(() => {
      const now = Date.now();

      // This does an upsert update and += the deebits... it's confusing but I am writing a comment here so now you know, you're welcome and i love you.
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
        .exec<{
          checked_at: number;
        }>(
          "SELECT ch_last_checked_at as checked_at FROM aggregated_debits WHERE org_id = ?",
          orgId
        )
        .one();
      return { clickhouseLastCheckedAt: result.checked_at };
    });
  }

  cancelEscrow(escrowId: string): void {
    this.ctx.storage.sql.exec("DELETE FROM escrows WHERE id = ?", escrowId);
  }

  updateClickhouseValues(orgId: string, clickhouseValue: number): void {
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

  getTableData(
    tableName: string,
    page: number,
    pageSize: number
  ): { data: any[]; total: number } {
    return this.ctx.storage.transactionSync(() => {
      const offset = page * pageSize;

      // Use hardcoded queries to prevent SQL injection
      switch (tableName) {
        case "processed_webhook_events": {
          const webhookCountResult = this.ctx.storage.sql
            .exec<{
              count: number;
            }>("SELECT COUNT(*) as count FROM processed_webhook_events")
            .one();
          const webhookRows = this.ctx.storage.sql
            .exec(
              "SELECT * FROM processed_webhook_events LIMIT ? OFFSET ?",
              pageSize,
              offset
            )
            .toArray();
          return { data: webhookRows, total: webhookCountResult.count };
        }

        case "disallow_list": {
          const disallowCountResult = this.ctx.storage.sql
            .exec<{
              count: number;
            }>("SELECT COUNT(*) as count FROM disallow_list")
            .one();
          const disallowRows = this.ctx.storage.sql
            .exec(
              "SELECT * FROM disallow_list LIMIT ? OFFSET ?",
              pageSize,
              offset
            )
            .toArray();
          return { data: disallowRows, total: disallowCountResult.count };
        }
        case "escrows": {
          const escrowCountResult = this.ctx.storage.sql
            .exec<{ count: number }>("SELECT COUNT(*) as count FROM escrows")
            .one();
          const escrowRows = this.ctx.storage.sql
            .exec("SELECT * FROM escrows LIMIT ? OFFSET ?", pageSize, offset)
            .toArray();
          return { data: escrowRows, total: escrowCountResult.count };
        }

        case "credit_purchases": {
          const creditCountResult = this.ctx.storage.sql
            .exec<{
              count: number;
            }>("SELECT COUNT(*) as count FROM credit_purchases")
            .one();
          const creditRows = this.ctx.storage.sql
            .exec(
              "SELECT * FROM credit_purchases LIMIT ? OFFSET ?",
              pageSize,
              offset
            )
            .toArray();
          return { data: creditRows, total: creditCountResult.count };
        }

        case "aggregated_debits": {
          const debitCountResult = this.ctx.storage.sql
            .exec<{
              count: number;
            }>("SELECT COUNT(*) as count FROM aggregated_debits")
            .one();
          const debitRows = this.ctx.storage.sql
            .exec(
              "SELECT * FROM aggregated_debits LIMIT ? OFFSET ?",
              pageSize,
              offset
            )
            .toArray();
          return { data: debitRows, total: debitCountResult.count };
        }

        case "alert_state": {
          const alertCountResult = this.ctx.storage.sql
            .exec<{
              count: number;
            }>("SELECT COUNT(*) as count FROM alert_state")
            .one();
          const alertRows = this.ctx.storage.sql
            .exec(
              "SELECT * FROM alert_state LIMIT ? OFFSET ?",
              pageSize,
              offset
            )
            .toArray();
          return { data: alertRows, total: alertCountResult.count };
        }

        case "disputes": {
          const disputeCountResult = this.ctx.storage.sql
            .exec<{ count: number }>("SELECT COUNT(*) as count FROM disputes")
            .one();
          const disputeRows = this.ctx.storage.sql
            .exec("SELECT * FROM disputes LIMIT ? OFFSET ?", pageSize, offset)
            .toArray();
          return { data: disputeRows, total: disputeCountResult.count };
        }

        default:
          throw new Error(`Invalid table name: ${tableName}`);
      }
    });
  }

  addDispute(
    disputeId: string,
    chargeId: string,
    amount: number,
    currency: string,
    reason: string,
    status: string,
    eventId: string
  ): Result<void, string> {
    const scaledAmount = amount * SCALE_FACTOR;

    return this.ctx.storage.transactionSync(() => {
      try {
        // Check if dispute already exists
        const existingDispute = this.ctx.storage.sql
          .exec<{
            count: number;
          }>("SELECT COUNT(*) as count FROM disputes WHERE id = ?", disputeId)
          .one();

        if (existingDispute.count > 0) {
          return err(`Dispute ${disputeId} already exists`);
        }

        // Insert the dispute
        this.ctx.storage.sql.exec(
          "INSERT INTO disputes (id, charge_id, amount, currency, reason, status, created_at, event_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          disputeId,
          chargeId,
          scaledAmount,
          currency,
          reason,
          status,
          Date.now(),
          eventId
        );

        return ok(undefined);
      } catch (error) {
        return err(`Failed to add dispute: ${error}`);
      }
    });
  }

  updateDispute(
    disputeId: string,
    status: string,
    eventId: string
  ): Result<void, string> {
    return this.ctx.storage.transactionSync(() => {
      try {
        // Check if dispute exists
        const existingDispute = this.ctx.storage.sql
          .exec<{
            count: number;
          }>("SELECT COUNT(*) as count FROM disputes WHERE id = ?", disputeId)
          .one();

        if (existingDispute.count === 0) {
          return err(`Dispute ${disputeId} not found`);
        }

        // Update the dispute status
        this.ctx.storage.sql.exec(
          "UPDATE disputes SET status = ?, event_id = ? WHERE id = ?",
          status,
          eventId,
          disputeId
        );

        return ok(undefined);
      } catch (error) {
        return err(`Failed to update dispute: ${error}`);
      }
    });
  }
}
