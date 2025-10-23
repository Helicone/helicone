// src/users/usersController.ts
import {
  Controller,
  Delete,
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
import { ENVIRONMENT } from "../../lib/clients/constant";
import { SettingsManager } from "../../utils/settings";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { AdminWalletManager } from "../../managers/admin/AdminWalletManager";
import { WalletState } from "../../types/wallet";
import { WalletManager } from "../../managers/wallet/WalletManager";

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
    dangerouslyBypassWalletCheck: boolean;
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
    @Query() sortOrder?: "asc" | "desc"
  ): Promise<Result<DashboardData, string>> {
    await authCheckThrow(request.authParams.userId);

    const settingsManager = new SettingsManager();
    const stripeProductSettings =
      await settingsManager.getSetting("stripe:products");
    if (!stripeProductSettings) {
      return err("Stripe product settings not configured");
    }

    const tokenUsageProductId =
      stripeProductSettings.cloudGatewayTokenUsageProduct;
    if (!tokenUsageProductId) {
      return err("Cloud gateway token usage product ID not configured");
    }

    const adminWalletManager = new AdminWalletManager(request.authParams);

    if (sortBy === "total_spend") {
      return adminWalletManager.getDashboardWithClickhouseSort(
        search || "",
        tokenUsageProductId,
        sortBy as any,
        sortOrder
      );
    }
    return adminWalletManager.getDashboardWithPostgresSort(
      search || "",
      tokenUsageProductId,
      sortBy as any,
      sortOrder
    );
  }

  @Post("/{orgId}")
  public async getWalletDetails(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string
  ): Promise<Result<WalletState, string>> {
    await authCheckThrow(request.authParams.userId);

    const adminWalletManager = new WalletManager(orgId);
    return adminWalletManager.getWalletState();
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
    @Query() creditLimit?: number,
    @Query() dangerouslyBypassWalletCheck?: boolean
  ): Promise<
    Result<
      {
        allowNegativeBalance: boolean;
        creditLimit: number;
        dangerouslyBypassWalletCheck: boolean;
      },
      string
    >
  > {
    await authCheckThrow(request.authParams.userId);

    // Validate that at least one parameter is provided
    if (
      allowNegativeBalance === undefined &&
      creditLimit === undefined &&
      dangerouslyBypassWalletCheck === undefined
    ) {
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

      if (dangerouslyBypassWalletCheck !== undefined) {
        updates.push(`dangerously_bypass_wallet_check = $${paramIndex}`);
        values.push(dangerouslyBypassWalletCheck);
        paramIndex++;
      }

      // Add orgId as the last parameter
      values.push(orgId);

      const updateResult = await dbExecute<{
        allow_negative_balance: boolean;
        credit_limit: string;
        dangerously_bypass_wallet_check: boolean;
      }>(
        `
        UPDATE organization
        SET ${updates.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING allow_negative_balance, credit_limit, dangerously_bypass_wallet_check
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
        dangerouslyBypassWalletCheck: updatedOrg.dangerously_bypass_wallet_check,
      });
    } catch (error) {
      console.error("Error updating wallet settings:", error);
      return err(`Error updating wallet settings: ${error}`);
    }
  }

  @Delete("/{orgId}/disallow-list")
  public async removeFromDisallowList(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string,
    @Query() provider: string,
    @Query() model: string
  ): Promise<Result<WalletState, string>> {
    await authCheckThrow(request.authParams.userId);

    // Validate inputs
    if (!provider || !model) {
      return err("Provider and model are required");
    }

    const workerApiUrl =
      process.env.HELICONE_WORKER_API ||
      process.env.WORKER_API_URL ||
      "https://api.helicone.ai";
    const adminAccessKey = process.env.HELICONE_MANUAL_ACCESS_KEY;

    if (!adminAccessKey) {
      return err("Admin access key not configured");
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${workerApiUrl}/admin/wallet/${orgId}/disallow-list`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminAccessKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ provider, model }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return err(`Failed to remove from disallow list: ${errorText}`);
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
      console.error("Error removing from disallow list:", error);
      return err(`Error removing from disallow list: ${error}`);
    }
  }
}
