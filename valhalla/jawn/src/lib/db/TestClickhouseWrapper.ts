import { ClickHouseClient, createClient } from "@clickhouse/client";
import { Result } from "../../packages/common/result";
import * as fs from "fs";
import * as path from "path";

interface ClickhouseEnv {
  CLICKHOUSE_HOST: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
}

export class TestClickhouseClientWrapper {
  private clickHouseClient: ClickHouseClient;

  constructor(env: ClickhouseEnv) {
    this.clickHouseClient = createClient({
      host: env.CLICKHOUSE_HOST,
      username: env.CLICKHOUSE_USER,
      password: env.CLICKHOUSE_PASSWORD,
    });
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
      console.error("Error executing Clickhouse query: ", query, parameters);
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

      console.log(
        `Running ${migrationFiles.length} migration files for test database...`
      );

      // Run each migration file
      for (const migrationFile of migrationFiles) {
        const migrationPath = path.join(migrationsDir, migrationFile);
        const migrationContent = fs.readFileSync(migrationPath, "utf8");

        console.log(`Running migration: ${migrationFile}`);

        try {
          await this.clickHouseClient.query({
            query: migrationContent,
          });
        } catch (err) {
          console.warn(
            `Warning: Migration ${migrationFile} failed, continuing...`,
            err
          );
          // Continue with other migrations even if one fails
          // This is useful for migrations that might not apply to test data
        }
      }

      console.log("All migrations completed for test database");
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

      console.log(
        `Dropping tables from ${migrationFiles.length} migration files for test database...`
      );

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

            console.log(`Dropping table: ${tableName}`);
            try {
              await this.clickHouseClient.query({ query: dropQuery });
            } catch (err) {
              console.warn(
                `Warning: Failed to drop table ${tableName}, continuing...`,
                err
              );
              // Continue with other tables even if one fails
            }
          }
        }
      }

      console.log("All tables dropped for test database");
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
      // Insert test data for different organizations
      const testDataQueries = [
        // Test data for organization "test-org-1"
        `INSERT INTO default.request_response_rmt VALUES
        ('resp-1', '2024-01-01 10:00:00', 1000, 200, 50, 100, 0, 0, 0, 0, 'gpt-4', 'req-1', '2024-01-01 10:00:00', 'user-1', 'test-org-1', 'proxy-1', false, 500, 'openai', 'US', 'https://api.openai.com/v1/chat/completions', '{}', '{}', '{"messages":[]}', '{"choices":[]}', '[]', '2024-01-01 10:00:00', '', false, 0.002),
        ('resp-2', '2024-01-01 11:00:00', 1500, 200, 75, 150, 0, 0, 0, 0, 'gpt-3.5-turbo', 'req-2', '2024-01-01 11:00:00', 'user-1', 'test-org-1', 'proxy-1', false, 600, 'openai', 'US', 'https://api.openai.com/v1/chat/completions', '{}', '{}', '{"messages":[]}', '{"choices":[]}', '[]', '2024-01-01 11:00:00', '', false, 0.001)`,

        // Test data for organization "test-org-2"
        `INSERT INTO default.request_response_rmt VALUES
        ('resp-3', '2024-01-01 12:00:00', 2000, 200, 100, 200, 0, 0, 0, 0, 'claude-3', 'req-3', '2024-01-01 12:00:00', 'user-2', 'test-org-2', 'proxy-2', false, 800, 'anthropic', 'CA', 'https://api.anthropic.com/v1/messages', '{}', '{}', '{"messages":[]}', '{"choices":[]}', '[]', '2024-01-01 12:00:00', '', false, 0.005)`,

        // Test tags data
        `INSERT INTO default.tags VALUES
        ('test-org-1', 'request', 'req-1', 'production', '2024-01-01 10:00:00', '2024-01-01 10:00:00'),
        ('test-org-1', 'request', 'req-2', 'staging', '2024-01-01 11:00:00', '2024-01-01 11:00:00'),
        ('test-org-2', 'request', 'req-3', 'production', '2024-01-01 12:00:00', '2024-01-01 12:00:00')`,

        // Test cache metrics data
        `INSERT INTO default.cache_metrics VALUES
        ('test-org-1', '2024-01-01', 10, 'req-1', 'gpt-4', 'openai', 5, 5000, 250, 500, 0, 0, 0, 0, '2024-01-01 10:05:00', '2024-01-01 10:00:00', '{"messages":[]}', '{"choices":[]}')`,
      ];

      for (const query of testDataQueries) {
        await this.clickHouseClient.query({ query });
      }

      return { data: null, error: null };
    } catch (err) {
      return {
        data: null,
        error: JSON.stringify(err),
      };
    }
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
  CLICKHOUSE_HOST: process.env.CLICKHOUSE_HOST || "http://localhost:18123",
  CLICKHOUSE_USER: process.env.CLICKHOUSE_USER || "default",
  CLICKHOUSE_PASSWORD: process.env.CLICKHOUSE_PASSWORD || "",
});
