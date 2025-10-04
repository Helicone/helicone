import { Result } from "../../../packages/common/result";
import { ClickhouseDB, RequestResponseRMT } from "../ClickhouseWrapper";
import {
  CLICKHOUSE_ERRORS,
  mockRequestResponseData,
} from "./clickhouseMockData";

interface ClickhouseEnv {
  CLICKHOUSE_HOST: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
  CLICKHOUSE_HQL_USER: string;
  CLICKHOUSE_HQL_PASSWORD: string;
}

interface SecurityRule {
  pattern: RegExp;
  errorCode: string;
  errorType: string;
  errorMessage: string;
}

export class MockClickhouseClientWrapper {
  private mockData: Map<string, any[]> = new Map();
  private securityRules: SecurityRule[] = [];
  private readonlyMode: boolean = true;
  private orgContext: string | null = null;

  constructor(env?: ClickhouseEnv) {
    // Initialize security rules that match ClickHouse's actual behavior
    this.initializeSecurityRules();
    // Load mock data
    this.initializeMockData();
  }

  private initializeSecurityRules(): void {
    this.securityRules = [
      // Block SETTINGS clause override attempts
      {
        pattern: /\bSETTINGS\s+/i,
        errorCode: CLICKHOUSE_ERRORS.SYNTAX_ERROR.code,
        errorType: CLICKHOUSE_ERRORS.SYNTAX_ERROR.type,
        errorMessage: "SETTINGS clause is not allowed in queries",
      },
      // Block multi-statement queries
      {
        pattern:
          /;\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|RENAME|GRANT|REVOKE)/i,
        errorCode: CLICKHOUSE_ERRORS.SYNTAX_ERROR.code,
        errorType: CLICKHOUSE_ERRORS.SYNTAX_ERROR.type,
        errorMessage: "Multi-statement queries are not allowed",
      },
      // Block DDL operations
      {
        pattern:
          /^\s*(?:CREATE|DROP|ALTER|TRUNCATE|RENAME)\s+(?:TABLE|DATABASE|VIEW)/i,
        errorCode: CLICKHOUSE_ERRORS.READONLY.code,
        errorType: CLICKHOUSE_ERRORS.READONLY.type,
        errorMessage: "DDL operations are not allowed in readonly mode",
      },
      // Block DML operations (INSERT, UPDATE, DELETE)
      {
        pattern: /^\s*(?:INSERT|UPDATE|DELETE)\s+/i,
        errorCode: CLICKHOUSE_ERRORS.READONLY.code,
        errorType: CLICKHOUSE_ERRORS.READONLY.type,
        errorMessage: "Cannot execute write query in readonly mode",
      },
      // Block dangerous table functions
      {
        pattern: /\b(?:file|url|odbc|hdfs|s3|input|mysql|postgresql)\s*\(/i,
        errorCode: CLICKHOUSE_ERRORS.ACCESS_DENIED.code,
        errorType: CLICKHOUSE_ERRORS.ACCESS_DENIED.type,
        errorMessage: "Access to table function is not allowed",
      },
      // Block access to information_schema
      {
        pattern: /\binformation_schema\b/i,
        errorCode: CLICKHOUSE_ERRORS.ACCESS_DENIED.code,
        errorType: CLICKHOUSE_ERRORS.ACCESS_DENIED.type,
        errorMessage: "Access to information_schema is denied",
      },
      // Block access to system.users
      {
        pattern: /\bsystem\.users\b/i,
        errorCode: CLICKHOUSE_ERRORS.ACCESS_DENIED.code,
        errorType: CLICKHOUSE_ERRORS.ACCESS_DENIED.type,
        errorMessage: "Access to system.users is denied",
      },
      // Block access to system.grants
      {
        pattern: /\bsystem\.grants\b/i,
        errorCode: CLICKHOUSE_ERRORS.ACCESS_DENIED.code,
        errorType: CLICKHOUSE_ERRORS.ACCESS_DENIED.type,
        errorMessage: "Access to system.grants is denied",
      },
      // Block access to system.row_policies
      {
        pattern: /\bsystem\.row_policies\b/i,
        errorCode: CLICKHOUSE_ERRORS.ACCESS_DENIED.code,
        errorType: CLICKHOUSE_ERRORS.ACCESS_DENIED.type,
        errorMessage: "Access to system.row_policies is denied",
      },
      // Block GRANT/REVOKE statements
      {
        pattern: /^\s*(?:GRANT|REVOKE)\s+/i,
        errorCode: CLICKHOUSE_ERRORS.SYNTAX_ERROR.code,
        errorType: CLICKHOUSE_ERRORS.SYNTAX_ERROR.type,
        errorMessage: "GRANT/REVOKE operations are not allowed",
      },
      // Block CREATE/ALTER/DROP USER
      {
        pattern: /^\s*(?:CREATE|ALTER|DROP)\s+USER\b/i,
        errorCode: CLICKHOUSE_ERRORS.SYNTAX_ERROR.code,
        errorType: CLICKHOUSE_ERRORS.SYNTAX_ERROR.type,
        errorMessage: "User management operations are not allowed",
      },
      // Block sleep function (resource exhaustion)
      {
        pattern: /\bsleep\s*\(\s*\d+\s*\)/i,
        errorCode: CLICKHOUSE_ERRORS.TIMEOUT.code,
        errorType: CLICKHOUSE_ERRORS.TIMEOUT.type,
        errorMessage: "Query exceeded maximum execution time",
      },
      // Block excessive CROSS JOIN queries (resource exhaustion)
      {
        pattern: /CROSS\s+JOIN.*CROSS\s+JOIN/is,
        errorCode: CLICKHOUSE_ERRORS.MEMORY_LIMIT.code,
        errorType: CLICKHOUSE_ERRORS.MEMORY_LIMIT.type,
        errorMessage: "Query exceeded maximum memory usage",
      },
      // Block UNION with system tables
      {
        pattern: /UNION.*system\./i,
        errorCode: CLICKHOUSE_ERRORS.ACCESS_DENIED.code,
        errorType: CLICKHOUSE_ERRORS.ACCESS_DENIED.type,
        errorMessage: "Access to system tables is denied",
      },
      // Block system.tables access in UNION
      {
        pattern: /system\.tables/i,
        errorCode: CLICKHOUSE_ERRORS.ACCESS_DENIED.code,
        errorType: CLICKHOUSE_ERRORS.ACCESS_DENIED.type,
        errorMessage: "Access to system.tables is denied",
      },
    ];
  }

  private initializeMockData(): void {
    // Load mock request_response_rmt data
    this.mockData.set("request_response_rmt", mockRequestResponseData);
  }

  async dbInsertClickhouse<T extends keyof ClickhouseDB["Tables"]>(
    table: T,
    values: ClickhouseDB["Tables"][T][],
  ): Promise<Result<string, string>> {
    // In readonly mode, all inserts should fail
    if (this.readonlyMode) {
      return {
        data: null,
        error: JSON.stringify({
          code: CLICKHOUSE_ERRORS.READONLY.code,
          type: CLICKHOUSE_ERRORS.READONLY.type,
          message: "Cannot execute write query in readonly mode",
        }),
      };
    }

    // Mock successful insert
    const existingData = this.mockData.get(table) || [];
    this.mockData.set(table, [...existingData, ...values]);

    return {
      data: `mock-query-id-${Date.now()}`,
      error: null,
    };
  }

  async dbQuery<RowType>(
    query: string,
    parameters: (number | string | boolean | Date)[],
  ): Promise<Result<RowType[], string>> {
    // Apply security checks
    const securityCheck = this.checkSecurity(query);
    if (securityCheck.error) {
      return securityCheck as Result<RowType[], string>;
    }

    // Mock query execution - return mock data
    const tableName = this.extractTableName(query);
    const data = this.mockData.get(tableName) || [];

    return { data: data as RowType[], error: null };
  }

  async dbQueryHql<RowType>(
    query: string,
    parameters: (number | string | boolean | Date)[],
  ): Promise<Result<RowType[], string>> {
    // HQL queries should go through the same security checks
    return this.dbQuery<RowType>(query, parameters);
  }

  async queryWithContext<RowType>(params: {
    query: string;
    organizationId: string;
    parameters: (number | string | boolean | Date)[];
  }): Promise<Result<RowType[], string>> {
    const { query, organizationId, parameters } = params;

    // Check for forbidden SQL_helicone_organization_id reference
    const forbiddenPattern = /sql[_\s]*helicone[_\s]*organization[_\s]*id/i;
    if (forbiddenPattern.test(query)) {
      return {
        data: null,
        error: JSON.stringify({
          code: CLICKHOUSE_ERRORS.SYNTAX_ERROR.code,
          type: CLICKHOUSE_ERRORS.SYNTAX_ERROR.type,
          message:
            "Query contains 'SQL_helicone_organization_id' keyword, which is not allowed in HQL queries",
        }),
      };
    }

    // Apply security rules
    for (const rule of this.securityRules) {
      if (rule.pattern.test(query)) {
        const error = {
          code: rule.errorCode,
          type: rule.errorType,
          message: rule.errorMessage,
        };

        // Special handling for DDL commands that would return syntax errors
        const isDDL =
          /^\s*(grant|revoke|create\s+(user|role)|alter\s+(user|role)|drop\s+(user|role))/i.test(
            query,
          );
        if (isDDL) {
          error.message = `Syntax error: failed at position ${query.indexOf(query.match(rule.pattern)?.[0] || "")} ('FORMAT') (line 2, col 1): FORMAT JSON. Expected one of: VALID UNTIL, HOST, SETTINGS, DEFAULT ROLE, ON, GRANTEES, DEFAULT DATABASE, IN, end of query.`;
        }

        return {
          data: null,
          error: JSON.stringify(error),
        };
      }
    }

    // If query passes security checks, return mock data with RLS applied
    const tableName = this.extractTableName(query);
    let data = this.mockData.get(tableName) || [];

    // Apply row-level security filtering
    if (tableName === "request_response_rmt" && organizationId) {
      data = this.applyRowLevelSecurity(data, organizationId);
    }

    // Apply WHERE clause filtering after RLS
    // This simulates how ClickHouse would apply WHERE conditions after row-level security
    if (
      query.includes(
        `WHERE organization_id = '${organizationId.replace(/'/g, "")}'`,
      )
    ) {
      // Already filtered by RLS, this WHERE is redundant but valid
    } else if (query.includes("WHERE organization_id = '")) {
      // Looking for a different org than what RLS allows - should return empty
      const whereOrgMatch = query.match(/WHERE organization_id = '([^']+)'/);
      if (whereOrgMatch && whereOrgMatch[1] !== organizationId) {
        data = [];
      }
    }

    // Handle specific query patterns
    if (query.includes("DISTINCT organization_id")) {
      // Return only the current org
      data = data.length > 0 ? [{ organization_id: organizationId }] : [];
    } else if (query.includes("count(*)")) {
      // Handle count queries
      if (query.includes(`organization_id != '${organizationId}'`)) {
        // Should return 0 for other orgs due to RLS
        data = [{ cnt: 0 }];
      } else {
        data = [{ cnt: data.length }];
      }
    } else if (query.includes("GROUP BY organization_id")) {
      // Group by should only show current org
      if (data.length > 0) {
        data = [{ organization_id: organizationId, cnt: data.length }];
      }
    }

    // Apply LIMIT if present
    const limitMatch = query.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1]);
      data = data.slice(0, limit);
    }

    return { data: data as RowType[], error: null };
  }

  private checkSecurity(query: string): Result<any[], string> {
    for (const rule of this.securityRules) {
      if (rule.pattern.test(query)) {
        return {
          data: null,
          error: JSON.stringify({
            code: rule.errorCode,
            type: rule.errorType,
            message: rule.errorMessage,
          }),
        };
      }
    }
    return { data: [], error: null };
  }

  private applyRowLevelSecurity(data: any[], organizationId: string): any[] {
    // Simulate ClickHouse row-level security
    return data.filter((row) => row.organization_id === organizationId);
  }

  private extractTableName(query: string): string {
    // Simple table name extraction
    const match = query.match(/FROM\s+([^\s]+)/i);
    return match ? match[1].replace(/`/g, "") : "";
  }

  // Mock methods that would normally interact with ClickHouse
  async createTestDatabase(): Promise<Result<null, string>> {
    // Mock - no actual database creation needed
    return { data: null, error: null };
  }

  async dropTestDatabase(): Promise<Result<null, string>> {
    // Mock - no actual database drop needed
    return { data: null, error: null };
  }

  async createTables(): Promise<Result<null, string>> {
    // Mock - tables are already "created" in mock data
    return { data: null, error: null };
  }

  async dropTables(): Promise<Result<null, string>> {
    // Mock - no actual table drop needed
    this.mockData.clear();
    this.initializeMockData();
    return { data: null, error: null };
  }

  async insertTestData(): Promise<Result<null, string>> {
    // Mock - data is already loaded
    return { data: null, error: null };
  }

  private paramsToValues(params: (number | string | boolean | Date)[]) {
    return params
      .map((p) => {
        if (p instanceof Date) {
          return p
            .toISOString()
            .replace("T", " ")
            .replace("Z", "")
            .replace(/\.\d+$/, "");
        } else {
          return p;
        }
      })
      .reduce((acc, parameter, index) => {
        return {
          ...acc,
          [`val_${index}`]: parameter,
        };
      }, {});
  }
}

// Export both the class and a singleton for tests
export const mockClickhouseDb = new MockClickhouseClientWrapper();
