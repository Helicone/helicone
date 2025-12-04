// src/users/usersController.ts
import {
  Body,
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
import { dbExecute, dbQueryClickhouse } from "../../lib/shared/db/dbExecute";
import { AdminWalletManager } from "../../managers/admin/AdminWalletManager";
import { AdminWalletAnalyticsManager } from "../../managers/admin/AdminWalletAnalyticsManager";
import { WalletState } from "../../types/wallet";
import { WalletManager } from "../../managers/wallet/WalletManager";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import Stripe from "stripe";
import { SecretManager } from "@helicone-package/secrets/SecretManager";
import { DiscountCalculator, OrgDiscount } from "../../utils/discountCalculator";
import { CreditsManager, ModelSpend, PTBInvoice } from "../../managers/creditsManager";

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

interface TableDataResponse {
  pageSize: number;
  data: {
    data: any[];
    total: number;
    page: number;
    message?: string;
  };
}

interface TimeSeriesDataPoint {
  timestamp: string;
  amount: number;
}

interface TimeSeriesResponse {
  deposits: TimeSeriesDataPoint[];
  spend: TimeSeriesDataPoint[];
}


interface InvoiceSummary {
  totalSpendCents: number;
  totalInvoicedCents: number;
  uninvoicedBalanceCents: number;
  lastInvoiceEndDate: string | null;
}

interface CreateInvoiceResponse {
  invoiceId: string;
  hostedInvoiceUrl: string | null;
  dashboardUrl: string; // Stripe dashboard URL for editing draft invoices
  amountCents: number;
  ptbInvoiceId: string;
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
    @Query() sortOrder?: "asc" | "desc",
    @Query() page?: number,
    @Query() pageSize?: number
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

    // Validate pagination parameters
    const validatedPage = Math.max(0, page ?? 0);
    const validatedPageSize = Math.min(Math.max(1, pageSize ?? 100), 100);

    const adminWalletManager = new AdminWalletManager(request.authParams);

    if (sortBy === "total_spend") {
      return adminWalletManager.getDashboardWithClickhouseSort(
        search || "",
        tokenUsageProductId,
        sortBy as any,
        sortOrder,
        validatedPage,
        validatedPageSize
      );
    }
    return adminWalletManager.getDashboardWithPostgresSort(
      search || "",
      tokenUsageProductId,
      sortBy as any,
      sortOrder,
      validatedPage,
      validatedPageSize
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

  @Post("/analytics/time-series")
  public async getTimeSeriesData(
    @Request() request: JawnAuthenticatedRequest,
    @Query() startDate: string,
    @Query() endDate: string,
    @Query() groupBy?: "minute" | "hour" | "day" | "week" | "month"
  ): Promise<Result<TimeSeriesResponse, string>> {
    await authCheckThrow(request.authParams.userId);

    // Get the token usage product ID from settings
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

    // Validate date parameters
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return err("Invalid date parameters");
    }

    if (start >= end) {
      return err("Start date must be before end date");
    }

    // Validate date range (max 90 days)
    const maxDays = 90;
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > maxDays) {
      return err(`Date range cannot exceed ${maxDays} days`);
    }

    const analyticsManager = new AdminWalletAnalyticsManager(
      request.authParams
    );

    // Default to day if not specified
    const timeGranularity = groupBy || "day";

    return analyticsManager.getTimeSeriesData(
      start,
      end,
      tokenUsageProductId,
      timeGranularity
    );
  }

  /**
   * Get spend breakdown for an org by date range.
   * Includes discounts applied per organization's discount rules.
   */
  @Post("/{orgId}/spend-breakdown")
  public async getSpendBreakdownForOrg(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string,
    @Query() startDate: string,
    @Query() endDate: string
  ): Promise<Result<ModelSpend[], string>> {
    await authCheckThrow(request.authParams.userId);

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return err("Invalid date format");
    }

    // Use CreditsManager with the target org's auth params
    const creditsManager = new CreditsManager({
      organizationId: orgId,
      userId: request.authParams.userId,
    });

    const result = await creditsManager.getSpendBreakdownByDateRange(start, end);

    if (result.error || !result.data) {
      return err(result.error ?? "Failed to get spend breakdown");
    }

    return ok(result.data.models);
  }

  /**
   * Delete a recorded invoice.
   */
  @Delete("/{orgId}/invoices/{invoiceId}")
  public async deleteInvoice(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string,
    @Path() invoiceId: string
  ): Promise<Result<{ deleted: boolean }, string>> {
    await authCheckThrow(request.authParams.userId);

    try {
      const result = await dbExecute(
        `DELETE FROM ptb_invoices WHERE id = $1 AND organization_id = $2`,
        [invoiceId, orgId]
      );

      if (result.error) {
        return err(`Error deleting invoice: ${result.error}`);
      }

      return ok({ deleted: true });
    } catch (error: any) {
      return err(`Error deleting invoice: ${error.message}`);
    }
  }

  /**
   * Update an invoice's hosted URL (for after sending from Stripe).
   */
  @Post("/{orgId}/invoices/{invoiceId}/update")
  public async updateInvoice(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string,
    @Path() invoiceId: string,
    @Body() body: { hostedInvoiceUrl: string | null }
  ): Promise<Result<{ updated: boolean }, string>> {
    await authCheckThrow(request.authParams.userId);

    try {
      const result = await dbExecute(
        `UPDATE ptb_invoices SET hosted_invoice_url = $1 WHERE id = $2 AND organization_id = $3`,
        [body.hostedInvoiceUrl, invoiceId, orgId]
      );

      if (result.error) {
        return err(`Error updating invoice: ${result.error}`);
      }

      return ok({ updated: true });
    } catch (error: any) {
      return err(`Error updating invoice: ${error.message}`);
    }
  }

  /**
   * List all recorded invoices for an org.
   */
  @Post("/{orgId}/invoices/list")
  public async listInvoices(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string
  ): Promise<Result<PTBInvoice[], string>> {
    await authCheckThrow(request.authParams.userId);

    try {
      const result = await dbExecute<{
        id: string;
        organization_id: string;
        stripe_invoice_id: string | null;
        hosted_invoice_url: string | null;
        start_date: string;
        end_date: string;
        amount_cents: string;
        notes: string | null;
        created_at: string;
      }>(
        `SELECT id, organization_id, stripe_invoice_id, hosted_invoice_url,
                start_date, end_date, amount_cents, notes, created_at
         FROM ptb_invoices WHERE organization_id = $1 ORDER BY created_at DESC`,
        [orgId]
      );

      if (result.error) {
        return err(`Error listing invoices: ${result.error}`);
      }

      const invoices: PTBInvoice[] = (result.data || []).map((row) => ({
        id: row.id,
        organizationId: row.organization_id,
        stripeInvoiceId: row.stripe_invoice_id,
        hostedInvoiceUrl: row.hosted_invoice_url,
        startDate: row.start_date,
        endDate: row.end_date,
        amountCents: parseInt(row.amount_cents, 10),
        notes: row.notes,
        createdAt: row.created_at,
      }));

      return ok(invoices);
    } catch (error: any) {
      return err(`Error listing invoices: ${error.message}`);
    }
  }

  /**
   * Get invoice summary: total spend, total invoiced, uninvoiced balance.
   */
  @Post("/{orgId}/invoice-summary")
  public async getInvoiceSummary(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string
  ): Promise<Result<InvoiceSummary, string>> {
    await authCheckThrow(request.authParams.userId);

    try {
      // Get total PTB spend from ClickHouse (all time)
      const spendQuery = `
        SELECT sum(cost) / ${COST_PRECISION_MULTIPLIER} as total_cost
        FROM request_response_rmt
        WHERE organization_id = {val_0 : String}
          AND is_passthrough_billing = true
      `;

      const spendResult = await dbQueryClickhouse<{ total_cost: string }>(
        spendQuery,
        [orgId]
      );

      if (spendResult.error) {
        return err(`Error fetching spend: ${spendResult.error}`);
      }

      const totalSpendUsd = parseFloat(spendResult.data?.[0]?.total_cost || "0");
      const totalSpendCents = Math.round(totalSpendUsd * 100);

      // Get total invoiced from Postgres
      const invoicedResult = await dbExecute<{
        total_invoiced: string;
        last_end_date: string | null;
      }>(
        `SELECT
           COALESCE(SUM(amount_cents), 0) as total_invoiced,
           MAX(end_date) as last_end_date
         FROM ptb_invoices
         WHERE organization_id = $1`,
        [orgId]
      );

      if (invoicedResult.error) {
        return err(`Error fetching invoiced amount: ${invoicedResult.error}`);
      }

      const totalInvoicedCents = parseInt(
        invoicedResult.data?.[0]?.total_invoiced || "0",
        10
      );
      const lastInvoiceEndDate =
        invoicedResult.data?.[0]?.last_end_date || null;

      return ok({
        totalSpendCents,
        totalInvoicedCents,
        uninvoicedBalanceCents: totalSpendCents - totalInvoicedCents,
        lastInvoiceEndDate,
      });
    } catch (error: any) {
      return err(`Error fetching invoice summary: ${error.message}`);
    }
  }

  /**
   * Create a Stripe invoice from spend breakdown and record it.
   * This creates line items in Stripe for each model/provider combo.
   */
  @Post("/{orgId}/create-invoice")
  public async createInvoice(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string,
    @Body()
    body: {
      startDate: string;
      endDate: string;
      daysUntilDue?: number;
    }
  ): Promise<Result<CreateInvoiceResponse, string>> {
    await authCheckThrow(request.authParams.userId);

    const start = new Date(body.startDate);
    const end = new Date(body.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return err("Invalid date format");
    }

    try {
      // 1. Get org's Stripe customer ID
      const orgResult = await dbExecute<{
        stripe_customer_id: string | null;
        name: string;
      }>(
        `SELECT stripe_customer_id, name FROM organization WHERE id = $1`,
        [orgId]
      );

      if (orgResult.error || !orgResult.data?.[0]) {
        return err("Organization not found");
      }

      const stripeCustomerId = orgResult.data[0].stripe_customer_id;
      const orgName = orgResult.data[0].name;

      if (!stripeCustomerId) {
        return err("Organization does not have a Stripe customer ID");
      }

      // 2. Get spend breakdown for date range
      const spendQuery = `
        SELECT
          model,
          provider,
          sum(prompt_tokens) as prompt_tokens,
          sum(completion_tokens) as completion_tokens,
          sum(cost) / ${COST_PRECISION_MULTIPLIER} as cost
        FROM request_response_rmt
        WHERE organization_id = {val_0 : String}
          AND is_passthrough_billing = true
          AND request_created_at >= {val_1 : DateTime64(3)}
          AND request_created_at < {val_2 : DateTime64(3)}
        GROUP BY model, provider
        HAVING cost > 0
        ORDER BY cost DESC
      `;

      const spendResult = await dbQueryClickhouse<{
        model: string;
        provider: string;
        prompt_tokens: string;
        completion_tokens: string;
        cost: string;
      }>(spendQuery, [orgId, start, end]);

      if (spendResult.error) {
        return err(`Error fetching spend data: ${spendResult.error}`);
      }

      if (!spendResult.data || spendResult.data.length === 0) {
        return err(`No spend data found for ${start.toISOString()} to ${end.toISOString()}`);
      }

      // 3. Get discount calculator for this org
      const discountCalculator = await DiscountCalculator.forOrg(orgId);

      console.log(`Creating invoice for ${orgId}: ${spendResult.data.length} line items found`);

      // 4. Initialize Stripe
      const stripe = new Stripe(SecretManager.getSecret("STRIPE_SECRET_KEY")!, {
        apiVersion: "2025-02-24.acacia",
      });

      // 5. Create the invoice FIRST (in draft mode) so we can attach items to it
      const periodStart = start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const periodEnd = end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const invoice = await stripe.invoices.create({
        customer: stripeCustomerId,
        collection_method: "send_invoice",
        days_until_due: body.daysUntilDue || 30,
        description: `API Usage: ${periodStart} - ${periodEnd}`,
        metadata: {
          orgId,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          type: "ptb_usage",
        },
        pending_invoice_items_behavior: "exclude", // Don't auto-include pending items
      });

      console.log(`Created draft invoice: ${invoice.id}`);

      // 6. Create invoice items with discounts applied
      const formatTokens = (tokens: number): string => {
        if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(2)}M`;
        if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
        return tokens.toLocaleString();
      };

      let totalAmountCents = 0;

      for (const item of spendResult.data) {
        const subtotalUsd = parseFloat(item.cost);
        const discountPercent = discountCalculator.findDiscount(
          item.model,
          item.provider
        );
        const totalUsd = subtotalUsd * (1 - discountPercent / 100);
        const amountCents = Math.round(totalUsd * 100);

        console.log(`  Item: ${item.model} - subtotal: ${subtotalUsd}, discount: ${discountPercent}%, total: ${totalUsd}, amountCents: ${amountCents}`);

        if (amountCents <= 0) continue;

        totalAmountCents += amountCents;

        const promptTokens = parseInt(item.prompt_tokens, 10) || 0;
        const completionTokens = parseInt(item.completion_tokens, 10) || 0;

        // Build description with discount info if applicable
        const modelInfo = `${item.model || "unknown"} (${item.provider || "unknown"})`;
        const discountInfo = discountPercent > 0 ? ` [${discountPercent}% discount]` : "";
        const tokenInfo = `${formatTokens(promptTokens)} input, ${formatTokens(completionTokens)} output`;
        const description = `${modelInfo}${discountInfo} - ${tokenInfo}`;

        const invoiceItem = await stripe.invoiceItems.create({
          customer: stripeCustomerId,
          invoice: invoice.id, // Explicitly attach to this invoice
          amount: amountCents,
          currency: "usd",
          description,
        });

        console.log(`  Created invoice item: ${invoiceItem.id} attached to ${invoice.id}`);
      }

      console.log(`Total amount: ${totalAmountCents} cents`);

      // 6. Record in ptb_invoices
      const ptbResult = await dbExecute<{ id: string }>(
        `INSERT INTO ptb_invoices (organization_id, stripe_invoice_id, start_date, end_date, amount_cents, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          orgId,
          invoice.id,
          start,
          end,
          totalAmountCents,
          `Auto-created invoice for ${orgName}`,
        ]
      );

      if (ptbResult.error) {
        // Invoice was created but recording failed - log but don't fail
        console.error("Failed to record invoice in ptb_invoices:", ptbResult.error);
      }

      // Build the Stripe dashboard URL for this invoice
      const dashboardUrl = `https://dashboard.stripe.com/invoices/${invoice.id}`;

      return ok({
        invoiceId: invoice.id,
        hostedInvoiceUrl: null, // Draft invoices don't have a hosted URL yet
        dashboardUrl,
        amountCents: totalAmountCents,
        ptbInvoiceId: ptbResult.data?.[0]?.id || "",
      });
    } catch (error: any) {
      return err(`Error creating invoice: ${error.message}`);
    }
  }

  /**
   * Get discount rules for an organization.
   */
  @Post("/{orgId}/discounts/list")
  public async listDiscounts(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string
  ): Promise<Result<OrgDiscount[], string>> {
    await authCheckThrow(request.authParams.userId);

    try {
      const result = await dbExecute<{ discounts: OrgDiscount[] | null }>(
        `SELECT discounts FROM organization WHERE id = $1`,
        [orgId]
      );

      if (result.error) {
        return err(`Error fetching discounts: ${result.error}`);
      }

      if (!result.data || result.data.length === 0) {
        return err("Organization not found");
      }

      return ok(result.data[0].discounts || []);
    } catch (error: any) {
      return err(`Error fetching discounts: ${error.message}`);
    }
  }

  /**
   * Update discount rules for an organization.
   */
  @Post("/{orgId}/discounts/update")
  public async updateDiscounts(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string,
    @Body() body: { discounts: OrgDiscount[] }
  ): Promise<Result<OrgDiscount[], string>> {
    await authCheckThrow(request.authParams.userId);

    try {
      // Validate discounts
      for (const discount of body.discounts) {
        if (discount.percent < 0 || discount.percent > 100) {
          return err("Discount percent must be between 0 and 100");
        }
      }

      const result = await dbExecute<{ discounts: OrgDiscount[] }>(
        `UPDATE organization SET discounts = $1 WHERE id = $2 RETURNING discounts`,
        [JSON.stringify(body.discounts), orgId]
      );

      if (result.error) {
        return err(`Error updating discounts: ${result.error}`);
      }

      if (!result.data || result.data.length === 0) {
        return err("Organization not found");
      }

      return ok(result.data[0].discounts || []);
    } catch (error: any) {
      return err(`Error updating discounts: ${error.message}`);
    }
  }
}
