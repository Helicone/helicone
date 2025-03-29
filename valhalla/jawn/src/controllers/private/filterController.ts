import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { supabaseServer } from "../../lib/db/supabase";
import { err, ok, Result } from "../../lib/shared/result";

import { JawnAuthenticatedRequest } from "../../types/request";
import { dbExecute } from "../../lib/shared/db/dbExecute";

type StoreFilterType = {
  id?: string;
  name: string;
  filter: any;
  createdAt?: string;
};

@Route("v1/filter")
@Tags("Filter")
@Security("api_key")
export class FilterController extends Controller {
  @Get("/")
  public async getFilters(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<StoreFilterType[], string>> {
    const { data, error: deleteError } = await dbExecute<{
      id: string;
      name: string;
      filter: string;
      created_at: string;
    }>(
      `
      SELECT id, filters->>'name' as name, filters->>'filter' as filter, created_at from 
      organization_layout
      WHERE organization_id = $1
      AND type = 'filter_ast'
      ORDER BY created_at DESC
      `,
      [request.authParams.organizationId]
    );

    if (deleteError) {
      this.setStatus(500);
      return err(`Failed to delete filter: ${deleteError}`);
    }

    return ok(
      data?.map((d) => ({
        id: d.id,
        name: d.name,
        filter: JSON.parse(d.filter),
        createdAt: d.created_at,
      })) ?? []
    );
  }

  @Get("/{id}")
  public async getFilter(
    @Path() id: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<StoreFilterType, string>> {
    const { data, error: deleteError } = await supabaseServer.client
      .from("organization_layout")
      .select("*")
      .eq("id", id)
      .eq("organization_id", request.authParams.organizationId);

    if (deleteError) {
      this.setStatus(500);
      return err(`Failed to get filter: ${deleteError.message}`);
    }

    return ok(data[0].filters as StoreFilterType);
  }

  @Post("/")
  public async createFilter(
    @Body()
    requestBody: StoreFilterType,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{ id: string }, string>> {
    const { error: createError, data } = await supabaseServer.client
      .from("organization_layout")
      .insert({
        organization_id: request.authParams.organizationId,
        filters: requestBody,
        type: "filter_ast",
      })
      .select("id")
      .single();

    if (createError) {
      this.setStatus(500);
      return err(`Failed to create filter: ${createError.message}`);
    }

    this.setStatus(201);
    return ok({ id: data.id });
  }

  @Delete("/{id}")
  public async deleteFilter(
    @Path() id: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const { error: deleteError } = await supabaseServer.client
      .from("organization_layout")
      .delete()
      .eq("id", id)
      .eq("organization_id", request.authParams.organizationId);

    if (deleteError) {
      this.setStatus(500);
      return err(`Failed to delete filter: ${deleteError.message}`);
    }

    this.setStatus(200);
    return ok(null);
  }

  @Patch("/{id}")
  public async updateFilter(
    @Body()
    requestBody: {
      filters: any;
    },
    @Path() id: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const { error: updateError } = await supabaseServer.client
      .from("organization_layout")
      .update({
        filters: requestBody.filters,
      })
      .eq("id", id)
      .eq("organization_id", request.authParams.organizationId);

    if (updateError) {
      this.setStatus(500);
      return err(`Failed to update filter: ${updateError.message}`);
    }

    this.setStatus(200);
    return ok(null);
  }
}
