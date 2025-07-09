import {
  Controller,
  Get,
  Route,
  Tags,
  Request,
  Post,
  Body,
  Put,
  Path,
  Delete,
} from "tsoa";
import { err, ok, Result } from "../../packages/common/result";
import { HeliconeSqlManager } from "../../managers/HeliconeSqlManager";
import { type JawnAuthenticatedRequest } from "../../types/request";
import {
  checkFeatureFlag,
  HQL_FEATURE_FLAG,
} from "../../lib/utils/featureFlags";
import { HqlQueryManager } from "../../managers/HqlQueryManager";

// --- Response Types ---
export interface ClickHouseTableSchema {
  table_name: string;
  columns: ClickHouseTableColumn[];
}

export interface ClickHouseTableColumn {
  name: string;
  type: string;
  default_type?: string;
  default_expression?: string;
  comment?: string;
  codec_expression?: string;
  ttl_expression?: string;
}

export interface ExecuteSqlRequest {
  sql: string;
}

export interface CreateSavedQueryRequest {
  name: string;
  sql: string;
}

export interface UpdateSavedQueryRequest extends CreateSavedQueryRequest {
  id: string;
}

export interface HqlSavedQuery {
  id: string;
  organization_id: string;
  name: string;
  sql: string;
  created_at: string;
  updated_at: string;
}

export type ExecuteSqlResponse = {
  rows: Record<string, any>[];
  elapsedMilliseconds: number;
  size: number;
  rowCount: number;
};

@Route("v1/helicone-sql")
@Tags("HeliconeSql")
export class HeliconeSqlController extends Controller {
  /**
   * Get ClickHouse schema (tables and columns)
   */
  @Get("schema")
  public async getClickHouseSchema(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ClickHouseTableSchema[], string>> {
    const heliconeSqlManager = new HeliconeSqlManager(request.authParams);
    return heliconeSqlManager.getClickhouseSchema();
  }

  @Post("execute")
  public async executeSql(
    @Body() requestBody: ExecuteSqlRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ExecuteSqlResponse, string>> {
    const featureFlagResult = await checkFeatureFlag(
      request.authParams.organizationId,
      HQL_FEATURE_FLAG
    );
    if (featureFlagResult.error) {
      return err(featureFlagResult.error);
    }

    const heliconeSqlManager = new HeliconeSqlManager(request.authParams);
    const result = await heliconeSqlManager.executeSql(requestBody.sql);
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error);
    }

    this.setStatus(200);
    return ok(result.data);
  }

  @Post("download")
  public async downloadCsv(
    @Body() requestBody: ExecuteSqlRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string, string>> {
    const heliconeSqlManager = new HeliconeSqlManager(request.authParams);
    const result = await heliconeSqlManager.downloadCsv(requestBody.sql);
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Failed to download csv");
    }

    this.setStatus(200);
    return ok(result.data);
  }

  @Get("saved-queries")
  public async getSavedQueries(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Array<HqlSavedQuery>, string>> {
    const heliconeSqlManager = new HqlQueryManager(request.authParams);
    const res = await heliconeSqlManager.getSavedQueries();
    if (res.error) {
      this.setStatus(500);
      return err(res.error);
    }
    this.setStatus(200);
    return ok(res.data || []);
  }

  @Get("saved-query/{queryId}")
  public async getSavedQuery(
    @Path() queryId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<HqlSavedQuery | null, string>> {
    const heliconeSqlManager = new HqlQueryManager(request.authParams);
    const result = await heliconeSqlManager.getSavedQuery(queryId);
    if (result.error) {
      this.setStatus(500);
      return err(result.error);
    }

    this.setStatus(200);
    return ok(result.data);
  }

  @Delete("saved-query/{queryId}")
  public async deleteSavedQuery(
    @Path() queryId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<void, string>> {
    const heliconeSqlManager = new HqlQueryManager(request.authParams);
    const result = await heliconeSqlManager.deleteSavedQuery(queryId);
    if (result.error) {
      this.setStatus(500);
      return err(result.error);
    }
    this.setStatus(200);
    return ok(undefined);
  }

  @Post("saved-query")
  public async createSavedQuery(
    @Body() requestBody: CreateSavedQueryRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<HqlSavedQuery[], string>> {
    const heliconeSqlManager = new HqlQueryManager(request.authParams);
    const result = await heliconeSqlManager.createSavedQuery(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error || "Error creating saved query");
    }
    this.setStatus(200);
    return ok(result.data);
  }

  @Put("saved-query")
  public async updateSavedQuery(
    @Body() requestBody: UpdateSavedQueryRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<HqlSavedQuery, string>> {
    const heliconeSqlManager = new HqlQueryManager(request.authParams);
    const result = await heliconeSqlManager.updateSavedQuery(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error);
    }
    this.setStatus(200);
    return ok(result.data);
  }
}
