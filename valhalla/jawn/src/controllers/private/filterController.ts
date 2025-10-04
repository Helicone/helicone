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
import { err, ok, Result } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";
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
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<StoreFilterType[], string>> {
    const { data, error } = await dbExecute<{
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
      [request.authParams.organizationId],
    );

    if (error) {
      this.setStatus(500);
      return err(`Failed to get filters: ${error}`);
    }

    return ok(
      data?.map((d) => ({
        id: d.id,
        name: d.name,
        filter: JSON.parse(d.filter),
        createdAt: d.created_at,
      })) ?? [],
    );
  }

  @Get("/{id}")
  public async getFilter(
    @Path() id: string,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<StoreFilterType, string>> {
    const { data, error } = await dbExecute<{
      filters: any;
    }>(
      `
      SELECT filters FROM organization_layout
      WHERE id = $1
      AND organization_id = $2
      `,
      [id, request.authParams.organizationId],
    );

    if (error || !data || data.length === 0) {
      this.setStatus(500);
      return err(`Failed to get filter: ${error}`);
    }

    return ok(data[0].filters as StoreFilterType);
  }

  @Post("/")
  public async createFilter(
    @Body()
    requestBody: StoreFilterType,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<{ id: string }, string>> {
    const { data, error } = await dbExecute<{ id: string }>(
      `
      INSERT INTO organization_layout
      (organization_id, filters, type)
      VALUES ($1, $2, 'filter_ast')
      RETURNING id
      `,
      [request.authParams.organizationId, requestBody],
    );

    if (error || !data || data.length === 0) {
      this.setStatus(500);
      return err(`Failed to create filter: ${error}`);
    }

    this.setStatus(201);
    return ok({ id: data[0].id });
  }

  @Delete("/{id}")
  public async deleteFilter(
    @Path() id: string,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<null, string>> {
    const { error } = await dbExecute(
      `
      DELETE FROM organization_layout
      WHERE id = $1
      AND organization_id = $2
      `,
      [id, request.authParams.organizationId],
    );

    if (error) {
      this.setStatus(500);
      return err(`Failed to delete filter: ${error}`);
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
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<null, string>> {
    const { error } = await dbExecute(
      `
      UPDATE organization_layout
      SET filters = $1
      WHERE id = $2
      AND organization_id = $3
      `,
      [requestBody.filters, id, request.authParams.organizationId],
    );

    if (error) {
      this.setStatus(500);
      return err(`Failed to update filter: ${error}`);
    }

    this.setStatus(200);
    return ok(null);
  }
}
