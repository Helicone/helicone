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
import { err, ok, Result, isError } from "../../packages/common/result";
import { HqlError, HqlErrorCode, StatusCodeMap } from "../../lib/errors/HqlErrors";
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

// Helper function to convert HqlError to string for API responses
function formatHqlError(error: HqlError): string {
  // Include error code in the response for frontend parsing
  const codePrefix = error.code ? `[${error.code}] ` : '';
  const message = error.details ? `${error.message}: ${error.details}` : error.message;
  return `${codePrefix}${message}`;
}

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
    const result = await heliconeSqlManager.getClickhouseSchema();
    
    if (isError(result)) {
      this.setStatus(result.error.statusCode || 500);
      return err(formatHqlError(result.error));
    }
    
    return ok(result.data);
  }

  @Post("execute")
  public async executeSql(
    @Body() requestBody: ExecuteSqlRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ExecuteSqlResponse, string>> {
    // Check feature flag access
    const featureFlagResult = await checkFeatureFlag(
      request.authParams.organizationId,
      HQL_FEATURE_FLAG
    );
    if (isError(featureFlagResult)) {
      this.setStatus(StatusCodeMap[HqlErrorCode.FEATURE_NOT_ENABLED] || 403);
      return err("Access to HQL feature is not enabled for your organization");
    }

    // Validate request
    if (!requestBody.sql?.trim()) {
      this.setStatus(400);
      return err("SQL query is required");
    }

    const heliconeSqlManager = new HeliconeSqlManager(request.authParams);
    const result = await heliconeSqlManager.executeSql(requestBody.sql);
    
    if (isError(result)) {
      this.setStatus(result.error.statusCode || 500);
      return err(formatHqlError(result.error));
    }

    this.setStatus(200);
    return ok(result.data);
  }

  @Post("download")
  public async downloadCsv(
    @Body() requestBody: ExecuteSqlRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string, string>> {
    // Check feature flag access
    const featureFlagResult = await checkFeatureFlag(
      request.authParams.organizationId,
      HQL_FEATURE_FLAG
    );
    if (isError(featureFlagResult)) {
      this.setStatus(StatusCodeMap[HqlErrorCode.FEATURE_NOT_ENABLED] || 403);
      return err("Access to HQL feature is not enabled for your organization");
    }

    // Validate request
    if (!requestBody.sql?.trim()) {
      this.setStatus(400);
      return err("SQL query is required for CSV download");
    }

    const heliconeSqlManager = new HeliconeSqlManager(request.authParams);
    const result = await heliconeSqlManager.downloadCsv(requestBody.sql);
    
    if (isError(result)) {
      this.setStatus(result.error.statusCode || 500);
      return err(formatHqlError(result.error));
    }

    this.setStatus(200);
    return ok(result.data);
  }

  @Get("saved-queries")
  public async getSavedQueries(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Array<HqlSavedQuery>, string>> {
    const hqlQueryManager = new HqlQueryManager(request.authParams);
    const res = await hqlQueryManager.getSavedQueries();
    
    if (isError(res)) {
      this.setStatus(res.error.statusCode || 500);
      return err(formatHqlError(res.error));
    }
    
    this.setStatus(200);
    return ok(res.data || []);
  }

  @Get("saved-query/{queryId}")
  public async getSavedQuery(
    @Path() queryId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<HqlSavedQuery | null, string>> {
    const hqlQueryManager = new HqlQueryManager(request.authParams);
    const result = await hqlQueryManager.getSavedQuery(queryId);
    
    if (isError(result)) {
      this.setStatus(result.error.statusCode || 500);
      return err(formatHqlError(result.error));
    }

    this.setStatus(200);
    return ok(result.data);
  }

  @Delete("saved-query/{queryId}")
  public async deleteSavedQuery(
    @Path() queryId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<void, string>> {
    const hqlQueryManager = new HqlQueryManager(request.authParams);
    const result = await hqlQueryManager.deleteSavedQuery(queryId);
    
    if (isError(result)) {
      this.setStatus(result.error.statusCode || 500);
      return err(formatHqlError(result.error));
    }
    
    this.setStatus(204);
    return ok(undefined);
  }

  @Post("saved-query")
  public async createSavedQuery(
    @Body() requestBody: CreateSavedQueryRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<HqlSavedQuery[], string>> {
    const hqlQueryManager = new HqlQueryManager(request.authParams);
    const result = await hqlQueryManager.createSavedQuery(requestBody);
    
    if (isError(result)) {
      this.setStatus(result.error.statusCode || 500);
      return err(formatHqlError(result.error));
    }
    
    this.setStatus(201);
    return ok(result.data);
  }

  @Put("saved-query")
  public async updateSavedQuery(
    @Body() requestBody: UpdateSavedQueryRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<HqlSavedQuery, string>> {
    const hqlQueryManager = new HqlQueryManager(request.authParams);
    const result = await hqlQueryManager.updateSavedQuery(requestBody);
    
    if (isError(result)) {
      this.setStatus(result.error.statusCode || 500);
      return err(formatHqlError(result.error));
    }
    
    this.setStatus(200);
    return ok(result.data);
  }
}
