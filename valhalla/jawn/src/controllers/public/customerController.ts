// src/users/usersController.ts
import {
  Body,
  Controller,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { clickhouseDb } from "../../lib/db/ClickhouseWrapper";
import { supabaseServer } from "../../lib/db/supabase";
import { clickhousePriceCalc } from "../../packages/cost";
import { JawnAuthenticatedRequest } from "../../types/request";

export interface CustomerUsage {
  id: string;
  name: string;
  cost: number;
  count: number;
  prompt_tokens: number;
  completion_tokens: number;
}

export interface Customer {
  id: string;
  name: string;
}

@Route("v1/customer")
@Tags("Customer")
@Security("api_key")
export class CustomerController extends Controller {
  @Post("/{customerId}/usage/query")
  public async getCustomerUsage(
    @Body()
    requestBody: {},
    @Request() request: JawnAuthenticatedRequest,
    @Path() customerId: string
  ): Promise<CustomerUsage | null> {
    const customers = await supabaseServer.client
      .from("organization")
      .select("*")
      .eq("reseller_id", request.authParams.organizationId)
      .eq("id", customerId)
      .eq("organization_type", "customer")
      .eq("soft_delete", "false")
      .single();

    if (customers.error) {
      this.setStatus(500);
      console.error(customers.error);
      return null;
    }

    const { data, error } = await clickhouseDb.dbQuery<{
      count: number;
      cost: number;
      prompt_tokens: number;
      completion_tokens: number;
    }>(
      `
      SELECT
        count(*) as count,
        ${clickhousePriceCalc("request_response_rmt")} as cost,
        count(request_response_rmt.prompt_tokens) as prompt_tokens,
        count(request_response_rmt.completion_tokens) as completion_tokens
      FROM request_response_rmt
      WHERE (
        request_response_rmt.organization_id = {val_0 : String}
      )
    `,
      [customerId]
    );

    if (error || !data) {
      console.error("Error checking limits:", error);
      this.setStatus(500);
      return null;
    }
    const { cost, count, prompt_tokens, completion_tokens } = data[0];
    this.setStatus(200);
    return {
      id: customers.data.id,
      name: customers.data.name,
      cost,
      count,
      prompt_tokens,
      completion_tokens,
    };
  }

  @Post("/query")
  public async getCustomers(
    @Body()
    requestBody: {},
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Customer[]> {
    const customers = await supabaseServer.client
      .from("organization")
      .select("*")
      .eq("reseller_id", request.authParams.organizationId)
      .eq("organization_type", "customer")
      .eq("soft_delete", "false");
    if (customers.error) {
      this.setStatus(500);
      console.error(customers.error);
      return [];
    }
    return (
      customers.data.map((customer) => ({
        id: customer.id,
        name: customer.name,
      })) ?? []
    );
  }
}
