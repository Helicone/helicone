// src/users/usersController.ts
import {
  Controller,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import type { JawnAuthenticatedRequest } from "../../types/request";

import { err, ok, Result } from "../../packages/common/result";
import { authCheckThrow } from "./adminController";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import { ENVIRONMENT } from "../../lib/clients/constant";
import { SettingsManager } from "../../utils/settings";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { clickhouseDb } from "../../lib/db/ClickhouseWrapper";

// Wallet API response interfaces
interface WalletState {
  balance: number;
  effectiveBalance: number;
  totalCredits: number;
  totalDebits: number;
  totalEscrow: number;
  disallowList: Array<{
    helicone_request_id: string;
    provider: string;
    model: string;
  }>;
}

interface TableDataResponse {
  pageSize: number;
  data: {
    data: any[];
    total: number;
    page: number;
    message?: string;
  };
}

@Route("v1/admin/wallet")
@Tags("Admin Wallet")
@Security("api_key")
export class AdminWalletController extends Controller {
  @Post("/gateway/dashboard_data")
  public async getGatewayDashboardData(
    @Request() request: JawnAuthenticatedRequest,
    @Query() search?: string,
    @Query() sortBy?: string,
    @Query() sortDirection?: "asc" | "desc"
  ): Promise<
    Result<
      {
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
        }>;
        summary: {
          totalOrgsWithCredits: number;
          totalCreditsIssued: number;
          totalCreditsSpent: number;
        };
        isProduction: boolean;
      },
      string
    >
  > {
    await authCheckThrow(request.authParams.userId);

    // Build ORDER BY clause
    const buildOrderBy = (
      sortBy?: string,
      sortDirection: "asc" | "desc" = "desc"
    ): string => {
      const direction = sortDirection.toUpperCase();

      switch (sortBy) {
        case "org_name":
          return `organization.name ${direction}`;
        case "created_date":
          return `organization.created_at ${direction}`;
        case "tier":
          return `organization.tier ${direction}`;
        case "owner_email":
          return `auth.users.email ${direction} NULLS LAST`;
        case "credit_limit":
          return `organization.credit_limit ${direction}`;
        case "total_payments":
          return `COALESCE(payment_aggregates.total_amount_received, 0) ${direction}`;
        case "payments_count":
          return `COALESCE(payment_aggregates.payments_count, 0) ${direction}`;
        case "last_payment_date":
          return `payment_aggregates.last_payment_date ${direction} NULLS LAST`;
        default:
          return `organization.created_at DESC`; // default
      }
    };

    const orderByClause = buildOrderBy(sortBy, sortDirection);

    // Build search filter
    const searchFilter = search
      ? `AND (
          organization.name ILIKE $1 OR
          organization.id::text ILIKE $1 OR
          organization.stripe_customer_id ILIKE $1 OR
          auth.users.email ILIKE $1
        )`
      : "";

    const searchParam = search ? [`%${search}%`] : [];

    // Get stripe product settings for payment data
    const settingsManager = new SettingsManager();
    const stripeProductSettings =
      await settingsManager.getSetting("stripe:products");

    let query: string;
    let params: any[];

    if (
      stripeProductSettings &&
      stripeProductSettings.cloudGatewayTokenUsageProduct
    ) {
      const tokenUsageProductId =
        stripeProductSettings.cloudGatewayTokenUsageProduct;

      // Use CTE to join organization data with payment aggregates for proper sorting
      params = search ? [tokenUsageProductId, `%${search}%`] : [tokenUsageProductId];
      const searchParamIndex = search ? "$2" : "";

      query = `
        WITH payment_aggregates AS (
          SELECT
            organization.id as org_id,
            SUM(stripe.payment_intents.amount_received) as total_amount_received,
            COUNT(stripe.payment_intents.id) as payments_count,
            MAX(stripe.payment_intents.created) as last_payment_date
          FROM stripe.payment_intents
          LEFT JOIN organization ON organization.stripe_customer_id = stripe.payment_intents.customer
          WHERE stripe.payment_intents.metadata->>'productId' = $1
            AND stripe.payment_intents.status = 'succeeded'
            AND organization.id IS NOT NULL
          GROUP BY organization.id
        )
        SELECT
          organization.id as org_id,
          organization.name as org_name,
          organization.stripe_customer_id,
          organization.tier,
          organization.created_at,
          auth.users.email as owner_email,
          organization.allow_negative_balance,
          organization.credit_limit,
          COALESCE(payment_aggregates.total_amount_received, 0) as total_amount_received,
          COALESCE(payment_aggregates.payments_count, 0) as payments_count,
          payment_aggregates.last_payment_date
        FROM organization
        LEFT JOIN auth.users ON organization.owner = auth.users.id
        LEFT JOIN payment_aggregates ON payment_aggregates.org_id = organization.id
        WHERE organization.soft_delete = false
        ${searchFilter.replace("$1", searchParamIndex)}
        ORDER BY ${orderByClause}
        LIMIT 100
      `;
    } else {
      // Fallback query without payment data
      params = searchParam;
      query = `
        SELECT
          organization.id as org_id,
          organization.name as org_name,
          organization.stripe_customer_id,
          organization.tier,
          organization.created_at,
          auth.users.email as owner_email,
          organization.allow_negative_balance,
          organization.credit_limit,
          0 as total_amount_received,
          0 as payments_count,
          NULL as last_payment_date
        FROM organization
        LEFT JOIN auth.users ON organization.owner = auth.users.id
        WHERE organization.soft_delete = false
        ${searchFilter}
        ORDER BY ${orderByClause}
        LIMIT 100
      `;
    }

    const orgsResult = await dbExecute<{
      org_id: string;
      org_name: string;
      stripe_customer_id: string;
      tier: string;
      created_at: string;
      owner_email: string;
      allow_negative_balance: boolean;
      credit_limit: string;
      total_amount_received: number;
      payments_count: number;
      last_payment_date: string | null;
    }>(query, params);

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

    // Combine the data - payment data is now in the org result from CTE
    const organizations = orgsResult.data.map((org) => {
      return {
        orgId: org.org_id,
        orgName: org.org_name || "Unknown",
        stripeCustomerId: org.stripe_customer_id || "",
        totalPayments: org.total_amount_received / 100, // Convert cents to dollars
        paymentsCount: Number(org.payments_count),
        clickhouseTotalSpend: clickhouseSpendMap.get(org.org_id) || 0,
        lastPaymentDate: org.last_payment_date
          ? Number(org.last_payment_date) * 1000
          : null, // Convert seconds to milliseconds
        tier: org.tier || "free",
        ownerEmail: org.owner_email || "Unknown",
        allowNegativeBalance: org.allow_negative_balance,
        creditLimit: org.credit_limit ? Number(org.credit_limit) / 100 : 0, // Convert cents to dollars
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

  @Post("/top-spenders")
  public async getTopSpenders(
    @Request() request: JawnAuthenticatedRequest,
    @Query() limit?: number,
    @Query() sortBy?: string,
    @Query() sortDirection?: "asc" | "desc",
    @Query() startDate?: string,
    @Query() endDate?: string
  ): Promise<
    Result<
      {
        topSpenders: Array<{
          orgId: string;
          orgName: string;
          totalSpent: number;
          requestCount: number;
          avgCostPerRequest: number;
          firstRequest: string | null;
          lastRequest: string | null;
        }>;
      },
      string
    >
  > {
    await authCheckThrow(request.authParams.userId);

    // Validate and set defaults
    const validatedLimit = Math.min(Math.max(1, limit ?? 50), 1000);

    // Build ORDER BY clause
    const buildOrderBy = (
      sortBy?: string,
      sortDirection: "asc" | "desc" = "desc"
    ): string => {
      const direction = sortDirection.toUpperCase();

      switch (sortBy) {
        case "total_cost":
          return `total_cost ${direction}`;
        case "request_count":
          return `request_count ${direction}`;
        case "avg_cost":
          return `avg_cost ${direction}`;
        case "first_request":
          return `first_request ${direction}`;
        case "last_request":
          return `last_request ${direction}`;
        default:
          return `total_cost DESC`; // default: highest spenders first
      }
    };

    const orderByClause = buildOrderBy(sortBy, sortDirection);

    // Build date filter
    let dateFilter = "";

    if (startDate || endDate) {
      const conditions: string[] = [];
      if (startDate) {
        conditions.push(`request_created_at >= '${startDate}'`);
      }
      if (endDate) {
        conditions.push(`request_created_at <= '${endDate}'`);
      }
      dateFilter = conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";
    }

    // Query ClickHouse for top spenders
    const clickhouseQuery = `
      SELECT
        organization_id,
        COUNT(*) as request_count,
        SUM(cost) as total_cost,
        AVG(cost) as avg_cost,
        MIN(request_created_at) as first_request,
        MAX(request_created_at) as last_request
      FROM request_response_rmt
      WHERE is_passthrough_billing = true
        ${dateFilter}
      GROUP BY organization_id
      ORDER BY ${orderByClause}
      LIMIT ${validatedLimit}
    `;

    const clickhouseResult = await clickhouseDb.dbQuery<{
      organization_id: string;
      request_count: number;
      total_cost: number;
      avg_cost: number;
      first_request: string;
      last_request: string;
    }>(clickhouseQuery, []);

    if (clickhouseResult.error || !clickhouseResult.data) {
      return err(
        clickhouseResult.error || "Failed to fetch top spenders from ClickHouse"
      );
    }

    if (clickhouseResult.data.length === 0) {
      return ok({ topSpenders: [] });
    }

    // Get organization names from PostgreSQL
    const orgIds = clickhouseResult.data.map((row) => row.organization_id);

    const orgsResult = await dbExecute<{
      id: string;
      name: string;
    }>(
      `SELECT id, name FROM organization WHERE id = ANY($1)`,
      [orgIds]
    );

    const orgNameMap = new Map<string, string>();
    if (orgsResult.data) {
      orgsResult.data.forEach((row) => {
        orgNameMap.set(row.id, row.name);
      });
    }

    // Combine data
    const topSpenders = clickhouseResult.data.map((row) => ({
      orgId: row.organization_id,
      orgName: orgNameMap.get(row.organization_id) || "Unknown",
      totalSpent: Number(row.total_cost) / COST_PRECISION_MULTIPLIER,
      requestCount: Number(row.request_count),
      avgCostPerRequest:
        Number(row.avg_cost) / COST_PRECISION_MULTIPLIER,
      firstRequest: row.first_request || null,
      lastRequest: row.last_request || null,
    }));

    return ok({ topSpenders });
  }

  @Post("/{orgId}")
  public async getWalletDetails(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string
  ): Promise<Result<WalletState, string>> {
    await authCheckThrow(request.authParams.userId);

    // Get the wallet state from the worker API using admin credentials
    const workerApiUrl =
      process.env.HELICONE_WORKER_API ||
      process.env.WORKER_API_URL ||
      "https://api.helicone.ai";
    const adminAccessKey = process.env.HELICONE_MANUAL_ACCESS_KEY;

    if (!adminAccessKey) {
      return err("Admin access key not configured");
    }

    try {
      // Use the admin endpoint that can query any org's wallet
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
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

  @Post("/{orgId}/tables/{tableName}")
  public async getWalletTableData(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string,
    @Path() tableName: string,
    @Query() page?: number,
    @Query() pageSize?: number
  ): Promise<Result<TableDataResponse, string>> {
    // Validate pagination parameters
    const validatedPage = Math.max(0, page ?? 0);
    const validatedPageSize = Math.min(Math.max(1, pageSize ?? 50), 100);

    await authCheckThrow(request.authParams.userId);

    // Validate table name to prevent injection
    const allowedTables = [
      "credit_purchases",
      "aggregated_debits",
      "escrows",
      "disallow_list",
      "processed_webhook_events",
    ];

    if (!allowedTables.includes(tableName)) {
      return err(`Invalid table name: ${tableName}`);
    }

    // Get table data from the worker API using admin credentials
    const workerApiUrl =
      process.env.HELICONE_WORKER_API ||
      process.env.WORKER_API_URL ||
      "https://api.helicone.ai";
    const adminAccessKey = process.env.HELICONE_MANUAL_ACCESS_KEY;

    if (!adminAccessKey) {
      return err("Admin access key not configured");
    }

    try {
      // Build query params for pagination
      const params = new URLSearchParams();
      if (page !== undefined) params.set("page", page.toString());
      if (pageSize !== undefined) params.set("pageSize", pageSize.toString());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      // Use the admin endpoint that can query any org's table data
      const response = await fetch(
        `${workerApiUrl}/admin/wallet/${orgId}/tables/${tableName}?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminAccessKey}`,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return err(`Failed to fetch table data: ${errorText}`);
      }

      const rawTableData = await response.json();

      // Transform the response to match the expected frontend structure
      const transformedResponse: TableDataResponse = {
        pageSize: validatedPageSize,
        data: {
          data: rawTableData.data || [],
          total: rawTableData.total || 0,
          page: rawTableData.page || 0,
          message: rawTableData.message,
        },
      };

      return ok(transformedResponse);
    } catch (error) {
      console.error("Error fetching table data:", error);

      // Fallback for local development when Durable Objects don't work
      if (ENVIRONMENT !== "production") {
        console.warn("Using fallback table data for local development");
        const fallbackResponse: TableDataResponse = {
          pageSize: validatedPageSize,
          data: {
            data: [],
            total: 0,
            page: validatedPage,
            message: "No data available (local development mode)",
          },
        };
        return ok(fallbackResponse);
      }

      return err(`Error fetching table data: ${error}`);
    }
  }

  @Post("/{orgId}/modify-balance")
  public async modifyWalletBalance(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string,
    @Query() amount: number,
    @Query() type: "credit" | "debit",
    @Query() reason: string
  ): Promise<Result<WalletState, string>> {
    await authCheckThrow(request.authParams.userId);

    // Validate inputs
    if (!amount || amount <= 0) {
      return err("Amount must be a positive number");
    }

    if (!type || (type !== "credit" && type !== "debit")) {
      return err("Type must be 'credit' or 'debit'");
    }

    if (!reason || reason.trim().length === 0) {
      return err("Reason is required for audit trail");
    }

    // Get the wallet API URL and admin access key
    const workerApiUrl =
      process.env.HELICONE_WORKER_API ||
      process.env.WORKER_API_URL ||
      "https://api.helicone.ai";
    const adminAccessKey = process.env.HELICONE_MANUAL_ACCESS_KEY;

    if (!adminAccessKey) {
      return err("Admin access key not configured");
    }

    try {
      // Create a unique reference ID for this manual modification
      const referenceId = `admin-manual-${Date.now()}-${request.authParams.userId}`;

      // Convert amount to cents for the API
      const amountInCents = Math.round(amount * 100);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      // Call the worker API to modify the wallet balance
      const response = await fetch(
        `${workerApiUrl}/admin/wallet/${orgId}/modify-balance`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminAccessKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amountInCents,
            type,
            reason,
            referenceId,
            adminUserId: request.authParams.userId,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return err(`Failed to modify wallet balance: ${errorText}`);
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
      console.error("Error modifying wallet balance:", error);

      // Fallback for local development when Durable Objects don't work
      if (ENVIRONMENT !== "production") {
        console.warn(
          "Wallet modification not available in local development mode"
        );
        return err(
          "Wallet modification is not available in local development mode. This feature requires production Durable Objects."
        );
      }

      return err(`Error modifying wallet balance: ${error}`);
    }
  }

  @Post("/{orgId}/update-settings")
  public async updateWalletSettings(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string,
    @Query() allowNegativeBalance?: boolean,
    @Query() creditLimit?: number
  ): Promise<
    Result<
      {
        allowNegativeBalance: boolean;
        creditLimit: number;
      },
      string
    >
  > {
    await authCheckThrow(request.authParams.userId);

    // Validate that at least one parameter is provided
    if (allowNegativeBalance === undefined && creditLimit === undefined) {
      return err("At least one setting must be provided");
    }

    // Validate credit limit if provided
    if (creditLimit !== undefined && creditLimit < 0) {
      return err("Credit limit must be a non-negative number");
    }

    try {
      // Build the update query dynamically based on provided parameters
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (allowNegativeBalance !== undefined) {
        updates.push(`allow_negative_balance = $${paramIndex}`);
        values.push(allowNegativeBalance);
        paramIndex++;
      }

      if (creditLimit !== undefined) {
        // Convert dollars to cents for storage
        const creditLimitInCents = Math.round(creditLimit * 100);
        updates.push(`credit_limit = $${paramIndex}`);
        values.push(creditLimitInCents);
        paramIndex++;
      }

      // Add orgId as the last parameter
      values.push(orgId);

      const updateResult = await dbExecute<{
        allow_negative_balance: boolean;
        credit_limit: string;
      }>(
        `
        UPDATE organization
        SET ${updates.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING allow_negative_balance, credit_limit
        `,
        values
      );

      if (updateResult.error) {
        return err(updateResult.error);
      }

      if (!updateResult.data || updateResult.data.length === 0) {
        return err("Organization not found");
      }

      const updatedOrg = updateResult.data[0];

      return ok({
        allowNegativeBalance: updatedOrg.allow_negative_balance,
        creditLimit: Number(updatedOrg.credit_limit) / 100, // Convert cents back to dollars
      });
    } catch (error) {
      console.error("Error updating wallet settings:", error);
      return err(`Error updating wallet settings: ${error}`);
    }
  }
}
