import { Controller, Get, Route, Tags, Request, Post, Body } from "tsoa";
import { err, ok, Result } from "../../packages/common/result";
import { HeliconeSqlManager } from "../../managers/HeliconeSqlManager";
import { type JawnAuthenticatedRequest } from "../../types/request";

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
  ): Promise<Result<Array<Record<string, any>>, string>> {
    // return ok([]);
    const heliconeSqlManager = new HeliconeSqlManager(request.authParams);
    const result = await heliconeSqlManager.executeSql(requestBody.sql);
    if (result.error) {
      this.setStatus(500);
      return err(result.error);
    }
    this.setStatus(200);
    return ok(result.data);
  }
}
