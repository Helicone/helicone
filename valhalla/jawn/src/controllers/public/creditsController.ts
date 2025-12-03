import { Controller, Get, Query, Request, Route, Security, Tags } from "tsoa";
import type { JawnAuthenticatedRequest } from "../../types/request";
import {
  CreditsManager,
  ModelSpend,
  PTBInvoice,
  SpendBreakdownResponse,
} from "../../managers/creditsManager";
import { err, isError, ok, Result } from "../../packages/common/result";

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

export interface CreditBalanceResponse {
  totalCreditsPurchased: number;
  balance: number;
}

@Route("v1/credits")
@Tags("Credits")
@Security("api_key")
export class CreditsController extends Controller {
  @Get("/balance")
  public async getCreditsBalance(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<CreditBalanceResponse, string>> {
    const creditsManager = new CreditsManager(request.authParams);
    const result = await creditsManager.getCreditsBalance();

    if (isError(result)) {
      this.setStatus(400);
      return err(result.error);
    }

    return ok(result.data);
  }

  @Get("/payments")
  public async listTokenUsagePayments(
    @Request() request: JawnAuthenticatedRequest,
    @Query() page?: number,
    @Query() pageSize?: number
  ): Promise<Result<PaginatedPurchasedCredits, string>> {
    const creditsManager = new CreditsManager(request.authParams);

    const pageSizeValue = pageSize ?? 10;
    if (pageSizeValue > 100) {
      this.setStatus(400);
      return err("Page size must be less than or equal to 100");
    }

    const result = await creditsManager.listTokenUsagePayments({
      page: page ?? 0,
      pageSize: pageSizeValue,
    });

    if (isError(result)) {
      this.setStatus(400);
      return err(result.error);
    }

    return ok(result.data);
  }

  @Get("/totalSpend")
  public async getTotalSpend(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{ totalSpend: number }, string>> {
    const creditsManager = new CreditsManager(request.authParams);

    const result = await creditsManager.getTotalSpend();

    if (isError(result)) {
      this.setStatus(400);
      return err(result.error);
    }

    return ok({ totalSpend: result.data });
  }

  @Get("/spend/breakdown")
  public async getSpendBreakdown(
    @Request() request: JawnAuthenticatedRequest,
    @Query() timeRange?: "7d" | "30d" | "90d" | "all",
    @Query() startDate?: string,
    @Query() endDate?: string
  ): Promise<Result<SpendBreakdownResponse, string>> {
    const creditsManager = new CreditsManager(request.authParams);

    // Use custom date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        this.setStatus(400);
        return err("Invalid date format. Use ISO 8601 format.");
      }
      const result = await creditsManager.getSpendBreakdownByDateRange(
        start,
        end
      );
      if (isError(result)) {
        this.setStatus(400);
        return err(result.error);
      }
      return ok(result.data);
    }

    // Fall back to preset time range
    const result = await creditsManager.getSpendBreakdown(timeRange ?? "30d");

    if (isError(result)) {
      this.setStatus(400);
      return err(result.error);
    }

    return ok(result.data);
  }

  @Get("/invoices")
  public async listInvoices(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<PTBInvoice[], string>> {
    const creditsManager = new CreditsManager(request.authParams);
    const result = await creditsManager.listInvoices();

    if (isError(result)) {
      this.setStatus(400);
      return err(result.error);
    }

    return ok(result.data);
  }
}
