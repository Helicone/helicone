import { ClickHouseClient, createClient } from "@clickhouse/client";
import * as fs from "fs";
import * as path from "path";
import { ClickhouseDB, RequestResponseRMT } from "../ClickhouseWrapper";
import { Result } from "../../../packages/common/result";

interface ClickhouseEnv {
  CLICKHOUSE_HOST: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
  CLICKHOUSE_HQL_USER: string;
  CLICKHOUSE_HQL_PASSWORD: string;
}

export class TestClickhouseClientWrapper {
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
        // Recommended for cluster usage to avoid situations
        // where a query processing error occurred after the response code
        // and HTTP headers were sent to the client.
        // See https://clickhouse.com/docs/en/interfaces/http/#response-buffering
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
      // Get the path to the migrations directory
      const migrationsDir = path.join(
        process.cwd(),
        "clickhouse",
        "migrations"
      );

      // Read all migration files
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort((a, b) => {
          // Extract schema number for sorting
          const aMatch = a.match(/schema_(\d+)/);
          const bMatch = b.match(/schema_(\d+)/);
          const aNum = aMatch ? parseInt(aMatch[1]) : 0;
          const bNum = bMatch ? parseInt(bMatch[1]) : 0;
          return aNum - bNum;
        });

      // Run each migration file
      for (const migrationFile of migrationFiles) {
        const migrationPath = path.join(migrationsDir, migrationFile);
        const migrationContent = fs.readFileSync(migrationPath, "utf8");

        try {
          await this.clickHouseClient.query({
            query: migrationContent,
          });
        } catch (err) {
          // Continue with other migrations even if one fails
          // This is useful for migrations that might not apply to test data
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
      // Get the path to the migrations directory
      const migrationsDir = path.join(
        process.cwd(),
        "clickhouse",
        "migrations"
      );

      // Read all migration files to get table names
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort((a, b) => {
          // Extract schema number for sorting
          const aMatch = a.match(/schema_(\d+)/);
          const bMatch = b.match(/schema_(\d+)/);
          const aNum = aMatch ? parseInt(aMatch[1]) : 0;
          const bNum = bMatch ? parseInt(bMatch[1]) : 0;
          return bNum - aNum; // Reverse order for dropping
        });

      // Extract table names from migration files and drop them
      for (const migrationFile of migrationFiles) {
        const migrationPath = path.join(migrationsDir, migrationFile);
        const migrationContent = fs.readFileSync(migrationPath, "utf8");

        // Extract table names from CREATE TABLE statements
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
      // Read test data from CSV file
      const csvPath = path.join(process.cwd(), "setup", "test_seed_rmt.csv");
      const csvContent = fs.readFileSync(csvPath, "utf8");

      // Parse CSV content into structured data
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
          prompt_cache_write_tokens: parseInt(values[8]),
          prompt_cache_read_tokens: parseInt(values[9]),
          prompt_audio_tokens: parseInt(values[10]),
          completion_audio_tokens: parseInt(values[10]),
          model: values[11],
          request_id: values[12],
          request_created_at: values[13],
          user_id: values[14],
          organization_id: values[15],
          proxy_key_id: values[16],
          threat: values[17] === "true",
          time_to_first_token: parseInt(values[18]),
          provider: values[19],
          country_code: values[21],
          target_url: values[20],
          properties: {},
          scores: {},
          request_body: values[25],
          response_body: values[26],
          assets: [values[28]],
          updated_at: values[29],
          cache_reference_id: values[6],
          cache_enabled: values[21] === "true",
          cost: parseFloat(values[27]),
        } as RequestResponseRMT;
      });

      // Insert data using proper ClickHouse insert method
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
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        // End of value
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    // Add the last value
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

// Export a singleton instance for tests
export const testClickhouseDb = new TestClickhouseClientWrapper({
  CLICKHOUSE_HOST: "http://localhost:18124",
  CLICKHOUSE_USER: process.env.CLICKHOUSE_USER || "default",
  CLICKHOUSE_PASSWORD: process.env.CLICKHOUSE_PASSWORD || "",
  CLICKHOUSE_HQL_USER: process.env.CLICKHOUSE_HQL_USER || "hql_user",
  CLICKHOUSE_HQL_PASSWORD: process.env.CLICKHOUSE_HQL_PASSWORD || "",
});
