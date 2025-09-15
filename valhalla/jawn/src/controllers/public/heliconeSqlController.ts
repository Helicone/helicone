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
  Security,
} from "tsoa";
import { err, ok, Result, isError } from "../../packages/common/result";
import { 
  HqlError, 
  HqlErrorCode, 
  createHqlError
} from "../../lib/errors/HqlErrors";
import { HeliconeSqlManager } from "../../managers/HeliconeSqlManager";
import { type JawnAuthenticatedRequest } from "../../types/request";
import {
  checkFeatureFlag,
  HQL_FEATURE_FLAG,
} from "../../lib/utils/featureFlags";
import { HqlQueryManager } from "../../managers/HqlQueryManager";
import tracer from "../../tracer";

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

export interface BulkDeleteSavedQueriesRequest {
  ids: string[];
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
   * @summary Get database schema
   * @returns {ClickHouseTableSchema[]} Array of table schemas with columns
   */
  @Security("api_key")
  @Get("schema")
  public async getClickHouseSchema(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ClickHouseTableSchema[], string>> {
    return await tracer.trace("hql.controller.getClickHouseSchema", async (span) => {
      span.setTag("organizationId", request.authParams.organizationId);
      span.setTag("component", "hql");
      span.setTag("operation.name", "getClickHouseSchema");
      span.setTag("span.kind", "server");

      try {
        const heliconeSqlManager = new HeliconeSqlManager(request.authParams);
        const result = await heliconeSqlManager.getClickhouseSchema();
        
        if (isError(result)) {
          span.setTag("error", true);
          span.setTag("error.type", result.error.code || "unknown");
          span.setTag("error.message", result.error.message);
          this.setStatus(result.error.statusCode || 500);
          return err(formatHqlError(result.error));
        }
        
        span.setTag("schema.table_count", result.data.length);
        return ok(result.data);
      } catch (error) {
        span.setTag("error", true);
        span.setTag("error.message", error instanceof Error ? error.message : String(error));
        throw error;
      }
    });
  }

  /**
   * Execute a SQL query against ClickHouse
   * @summary Execute SQL query
   * @param requestBody The SQL query to execute
   * @returns {ExecuteSqlResponse} Query results with rows and metadata
   */
  @Security("api_key")
  @Post("execute")
  public async executeSql(
    @Body() requestBody: ExecuteSqlRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ExecuteSqlResponse, string>> {
    return await tracer.trace("hql.controller.executeSql", async (span) => {
      span.setTag("organizationId", request.authParams.organizationId);
      span.setTag("service", "helicone-sql");
      span.setTag("operation", "executeSql");
      span.setTag("sql.length", requestBody.sql?.length || 0);

      try {
        // Check feature flag access
        const featureFlagResult = await checkFeatureFlag(
          request.authParams.organizationId,
          HQL_FEATURE_FLAG
        );
        if (isError(featureFlagResult)) {
          const error = createHqlError(HqlErrorCode.FEATURE_NOT_ENABLED);
          span.setTag("error", true);
          span.setTag("error.type", "FEATURE_NOT_ENABLED");
          span.setTag("error.message", error.message);
          this.setStatus(error.statusCode || 403);
          return err(formatHqlError(error));
        }

        // Validate request
        if (!requestBody.sql?.trim()) {
          const error = createHqlError(HqlErrorCode.MISSING_QUERY_SQL);
          span.setTag("error", true);
          span.setTag("error.type", "MISSING_QUERY_SQL");
          span.setTag("error.message", error.message);
          this.setStatus(error.statusCode || 400);
          return err(formatHqlError(error));
        }

        span.setTag("sql.query", requestBody.sql.substring(0, 200)); // First 200 chars for debugging
        
        const heliconeSqlManager = new HeliconeSqlManager(request.authParams);
        const result = await heliconeSqlManager.executeSql(requestBody.sql);
        
        if (isError(result)) {
          span.setTag("error", true);
          span.setTag("error.type", result.error.code || "unknown");
          span.setTag("error.message", result.error.message);
          this.setStatus(result.error.statusCode || 500);
          return err(formatHqlError(result.error));
        }

        span.setTag("result.row_count", result.data.rowCount);
        span.setTag("result.size_bytes", result.data.size);
        span.setTag("result.elapsed_ms", result.data.elapsedMilliseconds);
        
        this.setStatus(200);
        return ok(result.data);
      } catch (error) {
        span.setTag("error", true);
        span.setTag("error.message", error instanceof Error ? error.message : String(error));
        throw error;
      }
    });
  }

  /**
   * Execute a SQL query and download results as CSV
   * @summary Download query results as CSV
   * @param requestBody The SQL query to execute
   * @returns {string} URL to download the CSV file
   */
  @Security("api_key")
  @Post("download")
  public async downloadCsv(
    @Body() requestBody: ExecuteSqlRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string, string>> {
    return await tracer.trace("hql.controller.downloadCsv", async (span) => {
      span.setTag("organizationId", request.authParams.organizationId);
      span.setTag("service", "helicone-sql");
      span.setTag("operation", "downloadCsv");
      span.setTag("sql.length", requestBody.sql?.length || 0);

      try {
        // Check feature flag access
        const featureFlagResult = await checkFeatureFlag(
          request.authParams.organizationId,
          HQL_FEATURE_FLAG
        );
        if (isError(featureFlagResult)) {
          const error = createHqlError(HqlErrorCode.FEATURE_NOT_ENABLED);
          span.setTag("error", true);
          span.setTag("error.type", "FEATURE_NOT_ENABLED");
          span.setTag("error.message", error.message);
          this.setStatus(error.statusCode || 403);
          return err(formatHqlError(error));
        }

        // Validate request
        if (!requestBody.sql?.trim()) {
          const error = createHqlError(HqlErrorCode.MISSING_QUERY_SQL, "CSV download requires a SQL query");
          span.setTag("error", true);
          span.setTag("error.type", "MISSING_QUERY_SQL");
          span.setTag("error.message", error.message);
          this.setStatus(error.statusCode || 400);
          return err(formatHqlError(error));
        }

        span.setTag("sql.query", requestBody.sql.substring(0, 200)); // First 200 chars for debugging
        
        const heliconeSqlManager = new HeliconeSqlManager(request.authParams);
        const result = await heliconeSqlManager.downloadCsv(requestBody.sql);
        
        if (isError(result)) {
          span.setTag("error", true);
          span.setTag("error.type", result.error.code || "unknown");
          span.setTag("error.message", result.error.message);
          this.setStatus(result.error.statusCode || 500);
          return err(formatHqlError(result.error));
        }

        span.setTag("download.url_generated", !!result.data);
        
        this.setStatus(200);
        return ok(result.data);
      } catch (error) {
        span.setTag("error", true);
        span.setTag("error.message", error instanceof Error ? error.message : String(error));
        throw error;
      }
    });
  }

  /**
   * Get all saved queries for the organization
   * @summary List saved queries
   * @returns {HqlSavedQuery[]} Array of saved queries
   */
  @Security("api_key")
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

  /**
   * Get a specific saved query by ID
   * @summary Get saved query
   * @param queryId The ID of the saved query
   * @returns {HqlSavedQuery} The saved query details
   */
  @Security("api_key")
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

  /**
   * Delete a saved query by ID
   * @summary Delete saved query
   * @param queryId The ID of the saved query to delete
   */
  @Security("api_key")
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

  /**
   * Delete multiple saved queries at once
   * @summary Bulk delete saved queries
   * @param requestBody Array of query IDs to delete
   */
  @Security("api_key")
  @Post("saved-queries/bulk-delete")
  public async bulkDeleteSavedQueries(
    @Body() requestBody: BulkDeleteSavedQueriesRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<void, string>> {
    const hqlQueryManager = new HqlQueryManager(request.authParams);
    const result = await hqlQueryManager.bulkDeleteSavedQueries(requestBody.ids);
    if (isError(result)) {
      this.setStatus(result.error.statusCode || 500);
      return err(formatHqlError(result.error));
    }
    this.setStatus(200);
    return ok(undefined);
  }

  /**
   * Create a new saved query
   * @summary Create saved query
   * @param requestBody The saved query details
   * @returns {HqlSavedQuery[]} Array containing the created saved query
   */
  @Security("api_key")
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

  /**
   * Update an existing saved query
   * @summary Update saved query
   * @param queryId The ID of the saved query to update
   * @param requestBody The updated query details
   * @returns {HqlSavedQuery} The updated saved query
   */
  @Security("api_key")
  @Put("saved-query/{queryId}")
  public async updateSavedQuery(
    @Path() queryId: string,
    @Body() requestBody: CreateSavedQueryRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<HqlSavedQuery, string>> {
    const hqlQueryManager = new HqlQueryManager(request.authParams);
    const result = await hqlQueryManager.updateSavedQuery({
      id: queryId,
      ...requestBody
    });
    
    if (isError(result)) {
      this.setStatus(result.error.statusCode || 500);
      return err(formatHqlError(result.error));
    }
    
    this.setStatus(200);
    return ok(result.data);
  }
}
