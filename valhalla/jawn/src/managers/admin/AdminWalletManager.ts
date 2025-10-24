import { BaseManager } from "../BaseManager";
import { err, ok, Result } from "../../packages/common/result";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import { ENVIRONMENT } from "../../lib/clients/constant";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { clickhouseDb } from "../../lib/db/ClickhouseWrapper";
import { WalletState } from "../../types/wallet";

// Timeout constants for wallet API calls
const WALLET_STATE_FETCH_TIMEOUT = 3000; // 3 seconds for batch wallet state fetching
const WALLET_EVENTS_FETCH_TIMEOUT = 2000; // 2 seconds for webhook events count

interface DashboardData {
  organizations: Array<{
    orgId: string;
    orgName: string;
    stripeCustomerId: string;
    totalPayments: number;
    paymentsCount: number;
    clickhouseTotalSpend: number;
    lastPaymentDate: number | null;
    tier: string;
    ownerEmail: string;
    allowNegativeBalance: boolean;
    creditLimit: number;
    walletBalance?: number;
    walletEffectiveBalance?: number;
    walletTotalCredits?: number;
    walletTotalDebits?: number;
    walletDisallowedModelCount?: number;
    walletProcessedEventsCount?: number;
  }>;
  summary: {
    totalOrgsWithCredits: number;
    totalCreditsIssued: number;
    totalCreditsSpent: number;
  };
  isProduction: boolean;
}

export class AdminWalletManager extends BaseManager {
  /**
   * Fetches wallet state for a single organization
   */
  async fetchWalletState(orgId: string): Promise<{
    balance?: number;
    effectiveBalance?: number;
    totalCredits?: number;
    totalDebits?: number;
    disallowedModelCount?: number;
    processedEventsCount?: number;
  }> {
    const workerApiUrl =
      process.env.HELICONE_WORKER_API ||
      process.env.WORKER_API_URL ||
      "https://api.helicone.ai";
    const adminAccessKey = process.env.HELICONE_MANUAL_ACCESS_KEY;

    if (!adminAccessKey) {
      return {};
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        WALLET_STATE_FETCH_TIMEOUT
      );

      // Fetch wallet state
      const stateResponse = await fetch(
        `${workerApiUrl}/admin/wallet/${orgId}/state`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminAccessKey}`,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!stateResponse.ok) {
        return {};
      }

      const walletState = await stateResponse.json();

      // Fetch processed webhook events count
      const eventsController = new AbortController();
      const eventsTimeoutId = setTimeout(
        () => eventsController.abort(),
        WALLET_EVENTS_FETCH_TIMEOUT
      );

      let processedEventsCount = 0;
      try {
        const eventsResponse = await fetch(
          `${workerApiUrl}/admin/wallet/${orgId}/tables/processed_webhook_events?page=0&pageSize=1`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${adminAccessKey}`,
            },
            signal: eventsController.signal,
          }
        );
        clearTimeout(eventsTimeoutId);

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          processedEventsCount = eventsData.total || 0;
        }
      } catch {
        // Silently fail for events count
      }

      return {
        balance: (walletState.balance || 0) / 100,
        effectiveBalance: (walletState.effectiveBalance || 0) / 100,
        totalCredits: (walletState.totalCredits || 0) / 100,
        totalDebits: (walletState.totalDebits || 0) / 100,
        disallowedModelCount: walletState.disallowList?.length || 0,
        processedEventsCount,
      };
    } catch (error) {
      // Silently fail for individual orgs - we don't want to block the whole dashboard
      return {};
    }
  }

  /**
   * Fetches wallet states for multiple organizations in parallel
   */
  async fetchWalletStates(orgIds: string[]): Promise<
    Map<
      string,
      {
        balance?: number;
        effectiveBalance?: number;
        totalCredits?: number;
        totalDebits?: number;
        disallowedModelCount?: number;
        processedEventsCount?: number;
      }
    >
  > {
    const walletStates = await Promise.allSettled(
      orgIds.map(async (orgId) => ({
        orgId,
        state: await this.fetchWalletState(orgId),
      }))
    );

    const walletStateMap = new Map<
      string,
      {
        balance?: number;
        effectiveBalance?: number;
        totalCredits?: number;
        totalDebits?: number;
        disallowedModelCount?: number;
        processedEventsCount?: number;
      }
    >();

    walletStates.forEach((result) => {
      if (result.status === "fulfilled") {
        walletStateMap.set(result.value.orgId, result.value.state);
      } else {
        // Log failed wallet state fetches for debugging
        console.error(`Failed to fetch wallet state for org:`, result.reason);
      }
    });

    return walletStateMap;
  }

  async getDashboardWithClickhouseSort(
    search: string,
    tokenUsageProductId: string,
    _sortBy: "total_spend",
    sortOrder?: "asc" | "desc"
  ): Promise<Result<DashboardData, string>> {
    const order = sortOrder === "asc" ? "ASC" : "DESC";

    // Get top 100 organizations by spending from ClickHouse
    const clickhouseSpendResult = await clickhouseDb.dbQuery<{
      organization_id: string;
      total_cost: number;
    }>(
      `
        SELECT organization_id, spend as total_cost
        FROM organization_ptb_spend_mv FINAL
        ORDER BY total_cost ${order}
        LIMIT 100
      `,
      []
    );

    if (clickhouseSpendResult.error || !clickhouseSpendResult.data) {
      return err(
        clickhouseSpendResult.error || "Failed to fetch ClickHouse data"
      );
    }

    // Get org IDs from ClickHouse results
    const orgIds = clickhouseSpendResult.data.map((row) => row.organization_id);

    // If no data in ClickHouse, fall back to Postgres sort to still show organizations
    if (orgIds.length === 0) {
      return this.getDashboardWithPostgresSort(
        search,
        tokenUsageProductId,
        "org_created_at",
        sortOrder
      );
    }

    // Build search filter for org details query
    const searchFilter = search
      ? `AND (
          organization.name ILIKE $1 OR
          organization.id::text ILIKE $1 OR
          organization.stripe_customer_id ILIKE $1 OR
          auth.users.email ILIKE $1
        )`
      : "";

    // Build query parameters
    const queryParams = search ? [`%${search}%`] : [];
    queryParams.push(tokenUsageProductId);

    // Build IN clause with individual placeholders for each org ID
    const orgIdPlaceholders = orgIds
      .map((_, index) => `$${queryParams.length + index + 1}`)
      .join(", ");

    // Get organization details for these orgs
    const orgsResult = await dbExecute<{
      org_id: string;
      org_name: string;
      stripe_customer_id: string;
      tier: string;
      owner_email: string;
      allow_negative_balance: boolean;
      credit_limit: string;
      total_amount_received: number;
      payments_count: number;
      last_payment_date: string | null;
    }>(
      `
        SELECT
          organization.id as org_id,
          organization.name as org_name,
          organization.stripe_customer_id,
          organization.tier,
          auth.users.email as owner_email,
          organization.allow_negative_balance,
          organization.credit_limit,
          COALESCE(SUM(stripe.payment_intents.amount_received), 0) as total_amount_received,
          COALESCE(COUNT(stripe.payment_intents.id), 0) as payments_count,
          MAX(stripe.payment_intents.created) as last_payment_date
        FROM organization
        LEFT JOIN auth.users ON organization.owner = auth.users.id
        LEFT JOIN stripe.payment_intents ON
          organization.stripe_customer_id = stripe.payment_intents.customer
          AND stripe.payment_intents.metadata->>'productId' = $${search ? 2 : 1}
          AND stripe.payment_intents.status = 'succeeded'
        WHERE organization.soft_delete = false
          AND organization.id IN (${orgIdPlaceholders})
        ${searchFilter}
        GROUP BY
          organization.id,
          organization.name,
          organization.stripe_customer_id,
          organization.tier,
          auth.users.email,
          organization.allow_negative_balance,
          organization.credit_limit
        `,
      [...queryParams, ...orgIds]
    );

    if (orgsResult.error) {
      return err(orgsResult.error);
    }

    if (!orgsResult.data || orgsResult.data.length === 0) {
      return ok({
        organizations: [],
        isProduction: ENVIRONMENT === "production",
        summary: {
          totalOrgsWithCredits: 0,
          totalCreditsIssued: 0,
          totalCreditsSpent: 0,
        },
      });
    }

    // Create spend map from ClickHouse results
    const clickhouseSpendMap = new Map<string, number>();
    clickhouseSpendResult.data.forEach((row) => {
      clickhouseSpendMap.set(
        row.organization_id,
        Number(row.total_cost) / COST_PRECISION_MULTIPLIER
      );
    });

    // Fetch wallet states for all organizations in parallel
    const walletStateMap = await this.fetchWalletStates(orgIds);

    // Combine the data, maintaining ClickHouse sort order
    const orgDetailsMap = new Map(
      orgsResult.data.map((org) => [org.org_id, org])
    );

    const organizations = orgIds
      .map((orgId) => {
        const org = orgDetailsMap.get(orgId);
        if (!org) return null;

        const walletState = walletStateMap.get(orgId) || {};

        return {
          orgId: org.org_id,
          orgName: org.org_name || "Unknown",
          stripeCustomerId: org.stripe_customer_id || "",
          totalPayments: org.total_amount_received / 100,
          paymentsCount: org.payments_count,
          clickhouseTotalSpend: clickhouseSpendMap.get(org.org_id) || 0,
          lastPaymentDate: org.last_payment_date
            ? Number(org.last_payment_date) * 1000
            : null,
          tier: org.tier || "free",
          ownerEmail: org.owner_email || "Unknown",
          allowNegativeBalance: org.allow_negative_balance,
          creditLimit: org.credit_limit ? Number(org.credit_limit) / 100 : 0,
          walletBalance: walletState.balance,
          walletEffectiveBalance: walletState.effectiveBalance,
          walletTotalCredits: walletState.totalCredits,
          walletTotalDebits: walletState.totalDebits,
          walletDisallowedModelCount: walletState.disallowedModelCount,
          walletProcessedEventsCount: walletState.processedEventsCount,
        };
      })
      .filter((org): org is NonNullable<typeof org> => org !== null);

    // Calculate summary
    const totalCreditsIssued = organizations.reduce(
      (sum, org) => sum + org.totalPayments,
      0
    );
    const totalCreditsSpent = organizations.reduce(
      (sum, org) => sum + org.clickhouseTotalSpend,
      0
    );

    return ok({
      organizations,
      summary: {
        totalOrgsWithCredits: organizations.length,
        totalCreditsIssued,
        totalCreditsSpent,
      },
      isProduction: ENVIRONMENT === "production",
    });
  }

  async getDashboardWithPostgresSort(
    search: string,
    tokenUsageProductId: string,
    sortBy?:
      | "org_created_at"
      | "total_payments"
      | "credit_limit"
      | "amount_received",
    sortOrder?: "asc" | "desc"
  ): Promise<Result<DashboardData, string>> {
    // Build search filter
    const searchFilter = search
      ? `AND (
          organization.name ILIKE $1 OR
          organization.id::text ILIKE $1 OR
          organization.stripe_customer_id ILIKE $1 OR
          auth.users.email ILIKE $1
        )`
      : "";

    // Build query parameters
    const queryParams = search ? [`%${search}%`] : [];
    queryParams.push(tokenUsageProductId);

    function getOrderClause() {
      if (!sortBy) {
        return "ORDER BY organization.created_at DESC"; // Default sorting
      }

      let column: string;
      switch (sortBy) {
        case "org_created_at":
          column = "organization.created_at";
          break;
        case "total_payments":
          column = "total_amount_received";
          break;
        case "credit_limit":
          column = "organization.credit_limit";
          break;
        case "amount_received":
          column = "total_amount_received";
          break;
        default:
          column = "organization.created_at";
      }

      const order = sortOrder === "asc" ? "ASC" : "DESC"; // Default to DESC if not specified
      return `ORDER BY ${column} ${order}`;
    }

    const orderClause = getOrderClause();

    // Get ALL organizations with payment data in a single query
    // This allows admins to manage wallets even without Stripe integration
    const orgsResult = await dbExecute<{
      org_id: string;
      org_name: string;
      stripe_customer_id: string;
      tier: string;
      owner_email: string;
      allow_negative_balance: boolean;
      credit_limit: string;
      total_amount_received: number;
      payments_count: number;
      last_payment_date: string | null;
    }>(
      `
        SELECT
          organization.id as org_id,
          organization.name as org_name,
          organization.stripe_customer_id,
          organization.tier,
          auth.users.email as owner_email,
          organization.allow_negative_balance,
          organization.credit_limit,
          COALESCE(SUM(stripe.payment_intents.amount_received), 0) as total_amount_received,
          COALESCE(COUNT(stripe.payment_intents.id), 0) as payments_count,
          MAX(stripe.payment_intents.created) as last_payment_date
        FROM organization
        LEFT JOIN auth.users ON organization.owner = auth.users.id
        LEFT JOIN stripe.payment_intents ON
          organization.stripe_customer_id = stripe.payment_intents.customer
          AND stripe.payment_intents.metadata->>'productId' = $${search ? 2 : 1}
          AND stripe.payment_intents.status = 'succeeded'
        WHERE organization.soft_delete = false
        ${searchFilter}
        GROUP BY
          organization.id,
          organization.name,
          organization.stripe_customer_id,
          organization.tier,
          auth.users.email,
          organization.allow_negative_balance,
          organization.credit_limit,
          organization.created_at
        ${orderClause}
        LIMIT 100
        `,
      queryParams
    );

    if (orgsResult.error) {
      return err(orgsResult.error);
    }

    if (!orgsResult.data || orgsResult.data.length === 0) {
      return ok({
        organizations: [],
        isProduction: ENVIRONMENT === "production",
        summary: {
          totalOrgsWithCredits: 0,
          totalCreditsIssued: 0,
          totalCreditsSpent: 0,
        },
      });
    }

    // Get ClickHouse spending for these organizations
    const orgIds = orgsResult.data.map((org) => org.org_id);

    // SECURITY NOTE: This SQL query is safe from injection despite string interpolation.
    // The orgIds values come from a previous PostgreSQL query (not user input) and are
    // already validated UUIDs. This is an admin-only endpoint with proper authentication.
    // ClickHouse client doesn't support parameterized queries in the same way as PostgreSQL.
    const clickhouseSpendResult = await clickhouseDb.dbQuery<{
      organization_id: string;
      total_cost: number;
    }>(
      `
        SELECT
          organization_id,
          SUM(cost) as total_cost
        FROM request_response_rmt
        WHERE organization_id IN (${orgIds.map((orgId) => `'${orgId}'`).join(",")})
        and is_passthrough_billing = true
        GROUP BY organization_id
        `,
      orgIds
    );

    const clickhouseSpendMap = new Map<string, number>();
    if (!clickhouseSpendResult.error && clickhouseSpendResult.data) {
      clickhouseSpendResult.data.forEach((row) => {
        // Divide by precision multiplier to get dollars
        clickhouseSpendMap.set(
          row.organization_id,
          Number(row.total_cost) / COST_PRECISION_MULTIPLIER
        );
      });
    }

    // Fetch wallet states for all organizations in parallel
    const walletStateMap = await this.fetchWalletStates(orgIds);

    // Combine the data
    const organizations = orgsResult.data.map((org) => {
      const walletState = walletStateMap.get(org.org_id) || {};

      return {
        orgId: org.org_id,
        orgName: org.org_name || "Unknown",
        stripeCustomerId: org.stripe_customer_id || "",
        totalPayments: org.total_amount_received / 100, // Convert cents to dollars
        paymentsCount: org.payments_count,
        clickhouseTotalSpend: clickhouseSpendMap.get(org.org_id) || 0,
        lastPaymentDate: org.last_payment_date
          ? Number(org.last_payment_date) * 1000
          : null, // Convert seconds to milliseconds
        tier: org.tier || "free",
        ownerEmail: org.owner_email || "Unknown",
        allowNegativeBalance: org.allow_negative_balance,
        creditLimit: org.credit_limit ? Number(org.credit_limit) / 100 : 0, // Convert cents to dollars
        walletBalance: walletState.balance,
        walletEffectiveBalance: walletState.effectiveBalance,
        walletTotalCredits: walletState.totalCredits,
        walletTotalDebits: walletState.totalDebits,
        walletDisallowedModelCount: walletState.disallowedModelCount,
        walletProcessedEventsCount: walletState.processedEventsCount,
      };
    });

    // Calculate summary
    const totalCreditsIssued = organizations.reduce(
      (sum, org) => sum + org.totalPayments,
      0
    );
    const totalCreditsSpent = organizations.reduce(
      (sum, org) => sum + org.clickhouseTotalSpend,
      0
    );

    return ok({
      organizations,
      summary: {
        totalOrgsWithCredits: organizations.length,
        totalCreditsIssued,
        totalCreditsSpent,
      },
      isProduction: ENVIRONMENT === "production",
    });
  }
}
