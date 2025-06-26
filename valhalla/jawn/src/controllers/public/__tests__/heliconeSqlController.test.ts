import {
  describe,
  expect,
  test,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { HeliconeSqlController } from "../heliconeSqlController";
import { HeliconeSqlManager } from "../../../managers/HeliconeSqlManager";
import { testClickhouseDb } from "../../../lib/db/TestClickhouseWrapper";

describe("HeliconeSqlController Integration Tests", () => {
  let controller: HeliconeSqlController;
  let manager: HeliconeSqlManager;
  let mockRequest: any;

  beforeAll(async () => {
    // Initialize test database
    await testClickhouseDb.createTestDatabase();
    await testClickhouseDb.createTables();
  });

  afterAll(async () => {
    // Cleanup test database
    await testClickhouseDb.dropTables();
    await testClickhouseDb.dropTestDatabase();
  });

  beforeEach(async () => {
    // Reset test data before each test
    await testClickhouseDb.insertTestData();

    controller = new HeliconeSqlController();
    mockRequest = {
      authParams: {
        organizationId: "test-org-1", // Use the test org ID from the wrapper
        userId: "test-user-id",
      },
    };

    // Create manager with test database connection
    manager = new HeliconeSqlManager(mockRequest.authParams);
  });

  afterEach(async () => {
    // Clean up after each test by dropping and recreating tables
    await testClickhouseDb.dropTables();
    await testClickhouseDb.createTables();
  });

  describe("getClickHouseSchema", () => {
    test("should return schema for allowed tables", async () => {
      const result = await controller.getClickHouseSchema(mockRequest);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // Check that we get schema for the allowed tables
      const tableNames =
        result.data?.map((table: any) => table.table_name) || [];
      expect(tableNames).toContain("request_response_rmt");
      expect(tableNames).toContain("tags");
      expect(tableNames).toContain("cache_metrics");

      // Check that organization_id is filtered out
      const requestTable = result.data?.find(
        (table: any) => table.table_name === "request_response_rmt"
      );
      expect(requestTable).toBeDefined();
      if (requestTable) {
        const columnNames = requestTable.columns.map((col: any) => col.name);
        expect(columnNames).not.toContain("organization_id");
      }
    });
  });

  describe("executeSql - Basic Queries", () => {
    test("should execute simple SELECT query", async () => {
      const requestBody = { sql: "SELECT * FROM request_response_rmt LIMIT 5" };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(controller.getStatus()).toBe(200);
    });

    test("should execute query with WHERE clause", async () => {
      const requestBody = {
        sql: "SELECT request_id, model FROM request_response_rmt WHERE model = 'gpt-3.5-turbo' LIMIT 3",
      };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // All results should be gpt-3.5-turbo
      result.data?.forEach((row: any) => {
        expect(row.model).toBe("gpt-3.5-turbo");
      });
    });

    test("should execute query with aggregation", async () => {
      const requestBody = {
        sql: "SELECT model, COUNT(*) as count FROM request_response_rmt GROUP BY model",
      };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // Should have results for each model
      const models = result.data?.map((row: any) => row.model) || [];
      expect(models).toContain("gpt-3.5-turbo");
      expect(models).toContain("gpt-4");
    });
  });

  describe("executeSql - Organization Isolation", () => {
    test("should only return data for the authenticated organization", async () => {
      const requestBody = {
        sql: "SELECT organization_id, COUNT(*) as count FROM request_response_rmt GROUP BY organization_id",
      };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // Should only have data for the test organization
      result.data?.forEach((row: any) => {
        expect(row.organization_id).toBe("test-org-1");
      });
    });

    test("should not leak data from other organizations", async () => {
      const requestBody = {
        sql: "SELECT * FROM request_response_rmt ORDER BY request_created_at DESC LIMIT 10",
      };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();

      // All results should belong to the test organization
      result.data?.forEach((row: any) => {
        expect(row.organization_id).toBe("test-org-1");
      });
    });
  });

  describe("executeSql - SQL Injection Prevention", () => {
    test("should reject DROP statements", async () => {
      const requestBody = {
        sql: "DROP TABLE request_response_rmt",
      };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeDefined();
      expect(result.error).toContain("Only select statements");
      expect(controller.getStatus()).toBe(500);
    });

    test("should reject INSERT statements", async () => {
      const requestBody = {
        sql: "INSERT INTO request_response_rmt (request_id) VALUES ('test')",
      };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeDefined();
      expect(result.error).toContain("Only select statements");
      expect(controller.getStatus()).toBe(500);
    });

    test("should reject UPDATE statements", async () => {
      const requestBody = {
        sql: "UPDATE request_response_rmt SET model = 'hacked' WHERE 1=1",
      };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeDefined();
      expect(result.error).toContain("Only select statements");
      expect(controller.getStatus()).toBe(500);
    });

    test("should reject DELETE statements", async () => {
      const requestBody = {
        sql: "DELETE FROM request_response_rmt WHERE 1=1",
      };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeDefined();
      expect(result.error).toContain("Only select statements");
      expect(controller.getStatus()).toBe(500);
    });

    test("should reject CREATE statements", async () => {
      const requestBody = {
        sql: "CREATE TABLE malicious (id INT)",
      };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeDefined();
      expect(result.error).toContain("Only select statements");
      expect(controller.getStatus()).toBe(500);
    });
  });

  describe("executeSql - Table Access Control", () => {
    test("should reject queries to unauthorized tables", async () => {
      const requestBody = {
        sql: "SELECT * FROM users",
      };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeDefined();
      expect(result.error).toContain(
        "Only select statements and tables in CLICKHOUSE_TABLES are allowed"
      );
      expect(controller.getStatus()).toBe(500);
    });

    test("should reject queries to system tables", async () => {
      const requestBody = {
        sql: "SELECT * FROM system.users",
      };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeDefined();
      expect(result.error).toContain(
        "Only select statements and tables in CLICKHOUSE_TABLES are allowed"
      );
      expect(controller.getStatus()).toBe(500);
    });

    test("should allow queries to authorized tables", async () => {
      const authorizedTables = [
        "request_response_rmt",
        "tags",
        "cache_metrics",
      ];

      for (const table of authorizedTables) {
        const requestBody = {
          sql: `SELECT COUNT(*) as count FROM ${table}`,
        };

        const result = await controller.executeSql(requestBody, mockRequest);

        expect(result.error).toBeNull();
        expect(result.data).toBeDefined();
        expect(controller.getStatus()).toBe(200);
      }
    });
  });

  describe("executeSql - Complex Queries", () => {
    test("should handle JOIN queries", async () => {
      const requestBody = {
        sql: `
          SELECT r.request_id, r.model, t.tag 
          FROM request_response_rmt r 
          LEFT JOIN tags t ON r.request_id = t.entity_id 
          WHERE r.model = 'gpt-3.5-turbo' 
          LIMIT 5
        `,
      };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    test("should handle subqueries", async () => {
      const requestBody = {
        sql: `
          SELECT model, COUNT(*) as count 
          FROM request_response_rmt 
          WHERE request_created_at > (
            SELECT MIN(request_created_at) FROM request_response_rmt
          )
          GROUP BY model
        `,
      };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    test("should handle window functions", async () => {
      const requestBody = {
        sql: `
          SELECT 
            request_id, 
            model, 
            latency,
            ROW_NUMBER() OVER (PARTITION BY model ORDER BY latency DESC) as rank
          FROM request_response_rmt 
          LIMIT 10
        `,
      };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe("executeSql - Error Handling", () => {
    test("should handle malformed SQL", async () => {
      const requestBody = {
        sql: "SELECT * FROM request_response_rmt WHERE invalid_column = 'test'",
      };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeDefined();
      expect(controller.getStatus()).toBe(500);
    });

    test("should handle empty SQL", async () => {
      const requestBody = {
        sql: "",
      };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeDefined();
      expect(controller.getStatus()).toBe(500);
    });

    test("should handle SQL with syntax errors", async () => {
      const requestBody = {
        sql: "SELECT * FROM request_response_rmt WHERE model = 'test",
      };

      const result = await controller.executeSql(requestBody, mockRequest);

      expect(result.error).toBeDefined();
      expect(controller.getStatus()).toBe(500);
    });
  });
});
