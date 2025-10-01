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

interface CreditLineInfo {
  allowNegativeBalance: boolean;
  creditLineLimitCents: number | null;
}

@Route("v1/admin/wallet")
@Tags("Admin Wallet")
@Security("api_key")
export class AdminWalletController extends Controller {
  @Post("/gateway/dashboard_data")
  public async getGatewayDashboardData(
    @Request() request: JawnAuthenticatedRequest
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

    // Get ALL organizations (not just those with Stripe payments)
    // This allows admins to manage wallets even without Stripe integration
    const orgsResult = await dbExecute<{
      org_id: string;
      org_name: string;
      stripe_customer_id: string;
      tier: string;
      owner_email: string;
    }>(
      `
        SELECT
          organization.id as org_id,
          organization.name as org_name,
          organization.stripe_customer_id,
          organization.tier,
          auth.users.email as owner_email
        FROM organization
        LEFT JOIN auth.users ON organization.owner = auth.users.id
        WHERE organization.soft_delete = false
        ORDER BY organization.created_at DESC
        LIMIT 1000
        `,
      []
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

    // Get payment data for organizations that have Stripe payments (optional)
    const settingsManager = new SettingsManager();
    const stripeProductSettings =
      await settingsManager.getSetting("stripe:products");
    let paymentsMap = new Map<
      string,
      { total: number; count: number; lastDate: string }
    >();

    if (
      stripeProductSettings &&
      stripeProductSettings.cloudGatewayTokenUsageProduct
    ) {
      const tokenUsageProductId =
        stripeProductSettings.cloudGatewayTokenUsageProduct;
      const paymentsResult = await dbExecute<{
        org_id: string;
        total_amount_received: number;
        payments_count: number;
        last_payment_date: string;
      }>(
        `
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
          `,
        [tokenUsageProductId]
      );

      if (!paymentsResult.error && paymentsResult.data) {
        paymentsResult.data.forEach((row) => {
          paymentsMap.set(row.org_id, {
            total: row.total_amount_received,
            count: Number(row.payments_count),
            lastDate: row.last_payment_date,
          });
        });
      }
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

    // Combine the data
    const organizations = orgsResult.data.map((org) => {
      const payments = paymentsMap.get(org.org_id);
      return {
        orgId: org.org_id,
        orgName: org.org_name || "Unknown",
        stripeCustomerId: org.stripe_customer_id || "",
        totalPayments: payments ? payments.total / 100 : 0, // Convert cents to dollars
        paymentsCount: payments ? payments.count : 0,
        clickhouseTotalSpend: clickhouseSpendMap.get(org.org_id) || 0,
        lastPaymentDate: payments?.lastDate
          ? Number(payments.lastDate) * 1000
          : null, // Convert seconds to milliseconds
        tier: org.tier || "free",
        ownerEmail: org.owner_email || "Unknown",
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

  @Post("/{orgId}/credit-line-info")
  public async getCreditLineInfo(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string
  ): Promise<Result<CreditLineInfo, string>> {
    await authCheckThrow(request.authParams.userId);

    try {
      const result = await dbExecute<{
        allow_negative_balance: boolean;
        credit_line_limit_cents: number | null;
      }>(
        `
        SELECT allow_negative_balance, credit_line_limit_cents
        FROM organization
        WHERE id = $1
        `,
        [orgId]
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err("Organization not found");
      }

      const org = result.data[0];
      return ok({
        allowNegativeBalance: org.allow_negative_balance,
        creditLineLimitCents: org.credit_line_limit_cents,
      });
    } catch (error) {
      console.error("Error fetching credit line info:", error);
      return err(`Error fetching credit line info: ${error}`);
    }
  }

  @Post("/{orgId}/enable-negative-balance")
  public async enableNegativeBalance(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string
  ): Promise<Result<{ success: boolean }, string>> {
    await authCheckThrow(request.authParams.userId);

    try {
      const result = await dbExecute(
        `
        UPDATE organization
        SET allow_negative_balance = true
        WHERE id = $1
        `,
        [orgId]
      );

      if (result.error) {
        return err(result.error);
      }

      return ok({ success: true });
    } catch (error) {
      console.error("Error enabling negative balance:", error);
      return err(`Error enabling negative balance: ${error}`);
    }
  }

  @Post("/{orgId}/disable-negative-balance")
  public async disableNegativeBalance(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string
  ): Promise<Result<{ success: boolean }, string>> {
    await authCheckThrow(request.authParams.userId);

    try {
      const result = await dbExecute(
        `
        UPDATE organization
        SET allow_negative_balance = false
        WHERE id = $1
        `,
        [orgId]
      );

      if (result.error) {
        return err(result.error);
      }

      return ok({ success: true });
    } catch (error) {
      console.error("Error disabling negative balance:", error);
      return err(`Error disabling negative balance: ${error}`);
    }
  }

  @Post("/{orgId}/set-credit-limit")
  public async setCreditLimit(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string,
    @Query() limitCents?: number
  ): Promise<Result<{ success: boolean }, string>> {
    await authCheckThrow(request.authParams.userId);

    try {
      const result = await dbExecute(
        `
        UPDATE organization
        SET credit_line_limit_cents = $1
        WHERE id = $2
        `,
        [limitCents ?? null, orgId]
      );

      if (result.error) {
        return err(result.error);
      }

      return ok({ success: true });
    } catch (error) {
      console.error("Error setting credit limit:", error);
      return err(`Error setting credit limit: ${error}`);
    }
  }
}
