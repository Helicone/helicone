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
    const settingsManager = new SettingsManager();
    const stripeProductSettings =
      await settingsManager.getSetting("stripe:products");
    if (
      !stripeProductSettings ||
      !stripeProductSettings.cloudGatewayTokenUsageProduct
    ) {
      return err("stripe:products setting is not configured");
    }
    const tokenUsageProductId =
      stripeProductSettings.cloudGatewayTokenUsageProduct;

    // Get organizations with payments
    const paymentsResult = await dbExecute<{
      org_id: string;
      org_name: string;
      stripe_customer_id: string;
      tier: string;
      total_amount_received: number;
      payments_count: number;
      last_payment_date: string;
      owner_email: string;
    }>(
      `
        SELECT
          organization.id as org_id,
          organization.name as org_name,
          organization.stripe_customer_id,
          organization.tier,
          SUM(stripe.payment_intents.amount_received) as total_amount_received,
          COUNT(stripe.payment_intents.id) as payments_count,
          MAX(stripe.payment_intents.created) as last_payment_date,
          auth.users.email as owner_email
        FROM stripe.payment_intents
        LEFT JOIN organization ON organization.stripe_customer_id = stripe.payment_intents.customer
        LEFT JOIN auth.users ON organization.owner = auth.users.id
        WHERE stripe.payment_intents.metadata->>'productId' = $1
          AND stripe.payment_intents.status = 'succeeded'
          AND organization.id IS NOT NULL
        GROUP BY organization.id, organization.name, organization.stripe_customer_id, organization.tier, auth.users.email
        ORDER BY total_amount_received DESC
        LIMIT 1000
        `,
      [tokenUsageProductId]
    );

    if (paymentsResult.error) {
      return err(paymentsResult.error);
    }

    if (!paymentsResult.data || paymentsResult.data.length === 0) {
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
    const orgIds = paymentsResult.data.map((org) => org.org_id);

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
    const organizations = paymentsResult.data.map((org) => ({
      orgId: org.org_id,
      orgName: org.org_name || "Unknown",
      stripeCustomerId: org.stripe_customer_id,
      totalPayments: org.total_amount_received / 100, // Convert cents to dollars
      paymentsCount: Number(org.payments_count),
      clickhouseTotalSpend: clickhouseSpendMap.get(org.org_id) || 0,
      lastPaymentDate: org.last_payment_date
        ? Number(org.last_payment_date) * 1000
        : null, // Convert seconds to milliseconds
      tier: org.tier || "free",
      ownerEmail: org.owner_email || "Unknown",
    }));

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
      const response = await fetch(
        `${workerApiUrl}/admin/wallet/${orgId}/state`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminAccessKey}`,
          },
        }
      );

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

    const params = new URLSearchParams();
    if (validatedPage > 0) params.set("page", validatedPage.toString());
    params.set("pageSize", validatedPageSize.toString());

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

      // Use the admin endpoint that can query any org's table data
      const response = await fetch(
        `${workerApiUrl}/admin/wallet/${orgId}/tables/${tableName}?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminAccessKey}`,
          },
        }
      );

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
          message: rawTableData.message
        }
      };

      return ok(transformedResponse);
    } catch (error) {
      console.error("Error fetching table data:", error);
      return err(`Error fetching table data: ${error}`);
    }
  }
}
