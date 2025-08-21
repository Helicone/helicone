import { ClickHouseClient, createClient } from "@clickhouse/client";
import * as fs from "fs";
import * as path from "path";
import { ClickhouseDB, RequestResponseRMT } from "../ClickhouseWrapper";
import { Result } from "../../../packages/common/result";
import { IClickhouseWrapper, ClickhouseEnv } from "./IClickhouseWrapper";

/**
 * Real ClickHouse wrapper for integration testing with actual ClickHouse instance
 */
export class RealClickhouseWrapper implements IClickhouseWrapper {
  private clickHouseClient: ClickHouseClient;
  private clickHouseHqlClient: ClickHouseClient;

  constructor(env: ClickhouseEnv) {
    this.clickHouseClient = createClient({
      host: env.CLICKHOUSE_HOST,
      username: env.CLICKHOUSE_USER,
      password: env.CLICKHOUSE_PASSWORD,
    });

    this.clickHouseHqlClient = createClient({
      host: env.CLICKHOUSE_HOST,
      username: env.CLICKHOUSE_HQL_USER,
      password: env.CLICKHOUSE_HQL_PASSWORD,
    });
  }

  async dbInsertClickhouse<T extends keyof ClickhouseDB["Tables"]>(
    table: T,
    values: ClickhouseDB["Tables"][T][]
  ): Promise<Result<string, string>> {
    try {
      const queryResult = await this.clickHouseClient.insert({
        table: table,
        values: values,
        format: "JSONEachRow",
        clickhouse_settings: {
          async_insert: 1,
          wait_end_of_query: 1,
        },
      });
      return { data: queryResult.query_id, error: null };
    } catch (err) {
      return {
        data: null,
        error: JSON.stringify(err),
      };
    }
  }

  async dbQuery<T>(
    query: string,
    parameters: (number | string | boolean | Date)[]
  ): Promise<Result<T[], string>> {
    try {
      const query_params = this.paramsToValues(parameters);

      const queryResult = await this.clickHouseClient.query({
        query,
        query_params,
        format: "JSONEachRow",
        clickhouse_settings: {
          wait_end_of_query: 1,
        },
      });
      return { data: await queryResult.json<T[]>(), error: null };
    } catch (err) {
      return {
        data: null,
        error: JSON.stringify(err),
      };
    }
  }

  async dbQueryHql<T>(
    query: string,
    parameters: (number | string | boolean | Date)[]
  ): Promise<Result<T[], string>> {
    try {
      const query_params = this.paramsToValues(parameters);

      const queryResult = await this.clickHouseHqlClient.query({
        query,
        query_params,
        format: "JSONEachRow",
        clickhouse_settings: {
          wait_end_of_query: 1,
        },
      });
      return { data: await queryResult.json<T[]>(), error: null };
    } catch (err) {
      return {
        data: null,
        error: JSON.stringify(err),
      };
    }
  }

  async queryWithContext<RowType>(params: {
    query: string;
    organizationId: string;
    parameters: (number | string | boolean | Date)[];
  }): Promise<Result<RowType[], string>> {
    const { query, organizationId, parameters } = params;

    try {
      const query_params = this.paramsToValues(parameters);
      
      // Check for forbidden SQL_helicone_organization_id reference
      const forbiddenPattern = /sql[_\s]*helicone[_\s]*organization[_\s]*id/i;
      if (forbiddenPattern.test(query)) {
        return {
          data: null,
          error: JSON.stringify({
            code: "62",
            type: "SYNTAX_ERROR",
            message: "Query contains 'SQL_helicone_organization_id' keyword, which is not allowed in HQL queries",
          }),
        };
      }

      // Check if this is a DDL command that doesn't return data
      const isDDL = /^\s*(grant|revoke|create\s+(user|role)|alter\s+(user|role)|drop\s+(user|role))/i.test(query);

      const queryOptions: any = {
        query,
        query_params,
        clickhouse_settings: {
          wait_end_of_query: 1,
          SQL_helicone_organization_id: organizationId,
          readonly: 1,
          max_execution_time: 30,
          max_memory_usage: "1000000000",
          max_rows_to_read: "10000000",
          max_result_rows: "10000",
          allow_ddl: 0,
        } as any,
      };

      if (!isDDL) {
        queryOptions.format = "JSONEachRow";
      }

      const queryResult = await this.clickHouseHqlClient.query(queryOptions);
      
      if (isDDL) {
        return { data: [] as RowType[], error: null };
      } else {
        const rows = await queryResult.json<T[]>();
        return { data: rows, error: null };
      }
    } catch (err) {
      console.error("Error executing HQL query with context: ", query, organizationId, parameters);
      console.error(err);
      return {
        data: null,
        error: JSON.stringify(err),
      };
    }
  }

  async createTestDatabase(): Promise<Result<null, string>> {
    try {
      await this.clickHouseClient.query({
        query: `CREATE DATABASE IF NOT EXISTS default`,
      });
      return { data: null, error: null };
    } catch (err) {
      return {
        data: null,
        error: JSON.stringify(err),
      };
    }
  }

  async dropTestDatabase(): Promise<Result<null, string>> {
    try {
      await this.clickHouseClient.query({
        query: `DROP DATABASE IF EXISTS default`,
      });
      return { data: null, error: null };
    } catch (err) {
      return {
        data: null,
        error: JSON.stringify(err),
      };
    }
  }

  async createTables(): Promise<Result<null, string>> {
    try {
      const migrationsDir = path.join(
        process.cwd(),
        "clickhouse",
        "migrations"
      );

      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort((a, b) => {
          const aMatch = a.match(/schema_(\d+)/);
          const bMatch = b.match(/schema_(\d+)/);
          const aNum = aMatch ? parseInt(aMatch[1]) : 0;
          const bNum = bMatch ? parseInt(bMatch[1]) : 0;
          return aNum - bNum;
        });

      for (const migrationFile of migrationFiles) {
        const migrationPath = path.join(migrationsDir, migrationFile);
        const migrationContent = fs.readFileSync(migrationPath, "utf8");

        try {
          await this.clickHouseClient.query({
            query: migrationContent,
          });
        } catch (err) {
          // Continue with other migrations even if one fails
        }
      }

      return { data: null, error: null };
    } catch (err) {
      return {
        data: null,
        error: JSON.stringify(err),
      };
    }
  }

  async dropTables(): Promise<Result<null, string>> {
    try {
      const migrationsDir = path.join(
        process.cwd(),
        "clickhouse",
        "migrations"
      );

      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort((a, b) => {
          const aMatch = a.match(/schema_(\d+)/);
          const bMatch = b.match(/schema_(\d+)/);
          const aNum = aMatch ? parseInt(aMatch[1]) : 0;
          const bNum = bMatch ? parseInt(bMatch[1]) : 0;
          return bNum - aNum; // Reverse order for dropping
        });

      for (const migrationFile of migrationFiles) {
        const migrationPath = path.join(migrationsDir, migrationFile);
        const migrationContent = fs.readFileSync(migrationPath, "utf8");

        const tableMatches = migrationContent.match(
          /CREATE TABLE (?:IF NOT EXISTS )?([^\s(]+)/gi
        );
        if (tableMatches) {
          for (const match of tableMatches) {
            const tableName = match
              .replace(/CREATE TABLE (?:IF NOT EXISTS )?/i, "")
              .trim();
            const dropQuery = `DROP TABLE IF EXISTS default.${tableName}`;

            try {
              await this.clickHouseClient.query({ query: dropQuery });
            } catch (err) {
              // Continue with other tables even if one fails
            }
          }
        }
      }

      return { data: null, error: null };
    } catch (err) {
      return {
        data: null,
        error: JSON.stringify(err),
      };
    }
  }

  async insertTestData(): Promise<Result<null, string>> {
    try {
      const csvPath = path.join(process.cwd(), "setup", "test_seed_rmt.csv");
      const csvContent = fs.readFileSync(csvPath, "utf8");

      const lines = csvContent.trim().split("\n");
      const rows = lines.map((line) => {
        const values = this.parseCSVLine(line);
        return {
          response_id: values[0],
          response_created_at: values[1],
          latency: parseInt(values[2]),
          status: parseInt(values[3]),
          completion_tokens: parseInt(values[4]),
          prompt_tokens: parseInt(values[7]),
          model: values[11],
          request_id: values[12],
          request_created_at: values[13],
          user_id: values[14],
          organization_id: values[15],
          provider: values[19],
          properties: {},
          scores: {},
          request_body: values[25],
          response_body: values[26],
          cost: parseFloat(values[27]),
        } as RequestResponseRMT;
      });

      try {
        await this.dbInsertClickhouse("request_response_rmt", rows);
      } catch (err) {}

      return { data: null, error: null };
    } catch (err) {
      return {
        data: null,
        error: JSON.stringify(err),
      };
    }
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
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

// Export singleton for backward compatibility
export const testClickhouseDb = new RealClickhouseWrapper({
  CLICKHOUSE_HOST: process.env.CLICKHOUSE_HOST || "http://localhost:18123",
  CLICKHOUSE_USER: process.env.CLICKHOUSE_USER || "default",
  CLICKHOUSE_PASSWORD: process.env.CLICKHOUSE_PASSWORD || "",
  CLICKHOUSE_HQL_USER: process.env.CLICKHOUSE_HQL_USER || "hql_user",
  CLICKHOUSE_HQL_PASSWORD: process.env.CLICKHOUSE_HQL_PASSWORD || "",
});

// Alias for backward compatibility
export const TestClickhouseClientWrapper = RealClickhouseWrapper;