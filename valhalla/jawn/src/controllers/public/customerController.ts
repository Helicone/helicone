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
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";

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
    @Path() customerId: string,
  ): Promise<CustomerUsage | null> {
    const customerResult = await dbExecute<{
      id: string;
      name: string;
    }>(
      `SELECT id, name FROM organization
       WHERE reseller_id = $1
       AND id = $2
       AND organization_type = 'customer'
       AND soft_delete = false`,
      [request.authParams.organizationId, customerId],
    );

    if (
      customerResult.error ||
      !customerResult.data ||
      customerResult.data.length === 0
    ) {
      this.setStatus(500);
      console.error(customerResult.error);
      return null;
    }

    const customer = customerResult.data[0];

    const { data, error } = await clickhouseDb.dbQuery<{
      count: number;
      cost: number;
      prompt_tokens: number;
      completion_tokens: number;
    }>(
      `
      SELECT
        count(*) as count,
        sum(cost) / ${COST_PRECISION_MULTIPLIER} as cost,
        count(request_response_rmt.prompt_tokens) as prompt_tokens,
        count(request_response_rmt.completion_tokens) as completion_tokens
      FROM request_response_rmt
      WHERE (
        request_response_rmt.organization_id = {val_0 : String}
      )
    `,
      [customerId],
    );

    if (error || !data) {
      console.error("Error checking limits:", error);
      this.setStatus(500);
      return null;
    }
    const { cost, count, prompt_tokens, completion_tokens } = data[0];
    this.setStatus(200);
    return {
      id: customer.id,
      name: customer.name,
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
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Customer[]> {
    const customersResult = await dbExecute<{
      id: string;
      name: string;
    }>(
      `SELECT id, name FROM organization
       WHERE reseller_id = $1
       AND organization_type = 'customer'
       AND soft_delete = false`,
      [request.authParams.organizationId],
    );

    if (customersResult.error || !customersResult.data) {
      this.setStatus(500);
      console.error(customersResult.error);
      return [];
    }

    return (
      customersResult.data.map((customer) => ({
        id: customer.id,
        name: customer.name,
      })) ?? []
    );
  }
}
