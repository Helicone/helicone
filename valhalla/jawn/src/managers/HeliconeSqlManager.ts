import {
  ClickHouseTableSchema,
  ExecuteSqlResponse,
} from "../controllers/public/heliconeSqlController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { AuthParams } from "../packages/common/auth/types";
import { ok, Result, isError } from "../packages/common/result";
import {
  HqlError,
  HqlErrorCode,
  hqlError,
  parseClickhouseError,
} from "../lib/errors/HqlErrors";
import { AST, Parser } from "node-sql-parser";
import { HqlStore } from "../lib/stores/HqlStore";
import { z } from "zod";
import { S3Client } from "../lib/shared/db/s3Client";
import { DEFAULT_UUID } from "@helicone-package/llm-mapper/types";

export const CLICKHOUSE_TABLES = ["request_response_rmt"];
const MAX_LIMIT = 300000;
const parser = new Parser();
interface ClickHouseTableRow {
  name: string;
  type: string;
  default_type?: string;
  default_expression?: string;
  comment?: string;
  codec_expression?: string;
  ttl_expression?: string;
}

const describeRowSchema = z.object({
  name: z.string(),
  type: z.string(),
  default_type: z.string().optional(),
  default_expression: z.string().optional(),
  comment: z.string().optional(),
  codec_expression: z.string().optional(),
  ttl_expression: z.string().optional(),
});

function validateSql(sql: string): Result<null, HqlError> {
  try {
    const tables = parser.tableList(sql, { database: "Postgresql" });

    // type::DB::table
    const invalidTable = tables.find((table) => {
      const [type, _, tableName] = table.split("::");
      return type !== "select" || !CLICKHOUSE_TABLES.includes(tableName);
    });

    if (invalidTable) {
      const [type, _, tableName] = invalidTable.split("::");
      if (type !== "select") {
        return hqlError(
          HqlErrorCode.INVALID_STATEMENT,
          `Found ${type.toUpperCase()} statement`
        );
      }
      return hqlError(
        HqlErrorCode.INVALID_TABLE,
        `Table '${tableName}' is not allowed. Allowed tables: ${CLICKHOUSE_TABLES.join(', ')}`
      );
    }

    return ok(null);
  } catch (e) {
    return hqlError(
      HqlErrorCode.SYNTAX_ERROR,
      String(e)
    );
  }
}

function addLimit(ast: AST, limit: number): AST {
  if (ast.type !== "select") {
    throw new Error("Only select statements are allowed");
  }

  // If there's already a limit, ensure it doesn't exceed the limit
  if (ast.limit && ast.limit.value.length > 0) {
    if (ast.limit.value.length === 1) {
      const currentLimit = ast.limit.value[0]?.value;
      if (typeof currentLimit === "number") {
        ast.limit.value[0].value = Math.min(currentLimit, limit);
      }
    } else if (ast.limit.value.length === 2) {
      // Double LIMIT: LIMIT offset, count
      const currentCount = ast.limit.value[1]?.value;
      if (typeof currentCount === "number") {
        ast.limit.value[1].value = Math.min(currentCount, limit);
      }
    }
  } else {
    // No existing limit, add one with 1000
    ast.limit = {
      seperator: ",",
      value: [
        {
          type: "number",
          value: limit,
        },
      ],
    };
  }

  return ast;
}

function normalizeAst(ast: AST | AST[]): AST[] {
  if (Array.isArray(ast)) {
    return ast;
  }

  return [ast];
}

export class HeliconeSqlManager {
  private readonly hqlStore: HqlStore;
  private readonly s3Client: S3Client;

  constructor(private readonly authParams: AuthParams) {
    this.hqlStore = new HqlStore();
    this.s3Client = new S3Client(
      process.env.S3_ACCESS_KEY || undefined,
      process.env.S3_SECRET_KEY || undefined,
      process.env.S3_ENDPOINT_PUBLIC ?? process.env.S3_ENDPOINT ?? "",
      process.env.S3_BUCKET_NAME ?? "",
      (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
    );
  }

  async getClickhouseSchema(): Promise<
    Result<ClickHouseTableSchema[], HqlError>
  > {
    try {
      const schemaPromises = CLICKHOUSE_TABLES.map(async (table_name) => {
        const columns = await clickhouseDb.dbQuery<ClickHouseTableRow>(
          `DESCRIBE TABLE ${table_name}`,
          [],
          describeRowSchema
        );

        if (isError(columns)) {
          throw new Error(`Failed to describe table ${table_name}: ${columns.error}`);
        }

        return {
          table_name,
          columns:
            columns.data
              ?.map((col: ClickHouseTableRow) => ({
                name: col.name,
                type: col.type,
                default_type: col.default_type,
                default_expression: col.default_expression,
                comment: col.comment,
                codec_expression: col.codec_expression,
                ttl_expression: col.ttl_expression,
              }))
              .filter((col) => col.name !== "organization_id") ?? [],
        };
      });
      
      const schema = await Promise.all(schemaPromises);
      return ok(schema);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return hqlError(
        HqlErrorCode.SCHEMA_FETCH_FAILED,
        errorMessage
      );
    }
  }

  // Check for SQL injection by only always executing the first sql statement
  // Validate sql by only allowing select statements and tables in CLICKHOUSE_TABLES
  // Add limit check
  // Execute it
  async executeSql(
    sql: string,
    limit: number = 100
  ): Promise<Result<ExecuteSqlResponse, HqlError>> {
    try {
      // Parse SQL to validate and add limit
      let ast;
      try {
        ast = parser.astify(sql, { database: "Postgresql" });
      } catch (parseError) {
        return hqlError(
          HqlErrorCode.SYNTAX_ERROR,
          parseError instanceof Error ? parseError.message : String(parseError)
        );
      }
      
      // Always get first statement to prevent SQL injection
      const normalizedAst = normalizeAst(ast)[0];
      
      // Add limit to prevent excessive data retrieval
      let limitedAst;
      try {
        limitedAst = addLimit(normalizedAst, limit);
      } catch (limitError) {
        return hqlError(
          HqlErrorCode.SYNTAX_ERROR,
          `Failed to apply limit: ${limitError instanceof Error ? limitError.message : String(limitError)}`
        );
      }
      
      const firstSql = parser.sqlify(limitedAst, { database: "Postgresql" });

      // Validate SQL for security
      const validatedSql = validateSql(firstSql);
      if (isError(validatedSql)) {
        return validatedSql;
      }

      const start = Date.now();

      // Execute query with organization context for row-level security
      const result = await clickhouseDb.hqlQueryWithContext<
        ExecuteSqlResponse["rows"]
      >({
        query: firstSql,
        organizationId: this.authParams.organizationId,
        parameters: [],
      });

      const elapsedMilliseconds = Date.now() - start;

      if (isError(result)) {
        const errorString = String(result.error);
        const errorCode = parseClickhouseError(errorString);
        return hqlError(errorCode, errorString);
      }

      // Enrich results with S3 bodies if request_body or response_body columns are present
      const rows = result.data ?? [];
      const enrichedRows = await this.enrichResultsWithS3Bodies(rows);

      return ok({
        rows: enrichedRows,
        elapsedMilliseconds,
        size: Buffer.byteLength(JSON.stringify(enrichedRows), "utf8"),
        rowCount: enrichedRows.length,
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return hqlError(
        HqlErrorCode.UNEXPECTED_ERROR,
        errorMessage
      );
    }
  }

  private async enrichResultsWithS3Bodies(
    rows: Record<string, any>[]
  ): Promise<Record<string, any>[]> {
    // Early return for edge cases
    if (!rows || rows.length === 0) {
      return rows;
    }

    // Check if rows have request_id field
    if (!rows[0].hasOwnProperty('request_id')) {
      return rows;
    }

    // Process rows in batches for better performance
    const BATCH_SIZE = 10;
    const enrichedRows: Record<string, any>[] = [];
    
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const enrichedBatch = await Promise.all(
        batch.map(row => this.fetchRowBodiesFromS3(row))
      );
      enrichedRows.push(...enrichedBatch);
    }
    
    return enrichedRows;
  }

  private getRequestIdForS3(requestId: string, cacheReferenceId?: string): string {
    // Use cache reference ID if it exists and is not the default UUID
    if (cacheReferenceId && cacheReferenceId !== DEFAULT_UUID) {
      return cacheReferenceId;
    }
    return requestId;
  }

  private async fetchRowBodiesFromS3(
    row: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      const requestId = row.request_id;
      const requestIdForS3 = this.getRequestIdForS3(requestId, row.cache_reference_id);
      
      // Get signed URL for the request/response body
      const signedUrlResult = await this.s3Client.getRequestResponseBodySignedUrl(
        this.authParams.organizationId,
        requestIdForS3
      );
      
      if (signedUrlResult.error || !signedUrlResult.data) {
        return this.createRowWithNullBodies(row);
      }
      
      // Fetch and parse the body data from S3
      const bodyData = await this.fetchBodyFromS3Url(signedUrlResult.data);
      
      if (!bodyData) {
        console.error(`Failed to fetch S3 content for request ${requestId}`);
        return this.createRowWithNullBodies(row);
      }
      
      return {
        ...row,
        request_body: bodyData.request || null,
        response_body: bodyData.response || null,
      };
    } catch (error) {
      console.error(`Failed to enrich row with S3 bodies:`, error);
      return this.createRowWithNullBodies(row);
    }
  }

  private async fetchBodyFromS3Url(
    signedUrl: string
  ): Promise<{ request: any; response: any } | null> {
    try {
      const response = await fetch(signedUrl);
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch from S3 URL:`, error);
      return null;
    }
  }

  private createRowWithNullBodies(row: Record<string, any>): Record<string, any> {
    return {
      ...row,
      request_body: null,
      response_body: null,
    };
  }

  async downloadCsv(sql: string): Promise<Result<string, HqlError>> {
    const result = await this.executeSql(sql, MAX_LIMIT);
    if (isError(result)) {
      return result;
    }

    if (!result.data?.rows?.length) {
      return hqlError(HqlErrorCode.NO_DATA_RETURNED);
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `hql-export-${timestamp}.csv`;
    
    // Upload to S3
    const uploadResult = await this.hqlStore.uploadCsv(
      filename,
      this.authParams.organizationId,
      result.data.rows
    );

    if (isError(uploadResult)) {
      return hqlError(
        HqlErrorCode.CSV_UPLOAD_FAILED,
        uploadResult.error
      );
    }

    if (!uploadResult.data) {
      return hqlError(HqlErrorCode.CSV_URL_NOT_RETURNED);
    }

    return ok(uploadResult.data);
  }
}
