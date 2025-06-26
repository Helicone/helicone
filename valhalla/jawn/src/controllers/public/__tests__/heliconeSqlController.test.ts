import { describe, expect, test, beforeEach, afterEach } from "@jest/globals";
import { testClickhouseDb } from "../../../lib/db/TestClickhouseWrapper";

require("dotenv").config({
  path: "./.env",
});

// Test configuration
const BASE_URL = "http://127.0.0.1:8585/v1";
const TEST_ORG_ID = "ee562ee8-7e70-4550-976a-601c8fe8d9f3"; // From CSV data
const authToken = "sk-helicone-aizk36y-5yue2my-qmy5tza-n7x3aqa";

describe("HeliconeSqlController HTTP Integration Tests", () => {
  beforeEach(async () => {
    // Reset test data before each test
    await testClickhouseDb.createTables();
    await testClickhouseDb.insertTestData();
  });

  afterEach(async () => {
    // Clean up after each test
    await testClickhouseDb.dropTables();
  });

  describe("GET /helicone-sql/schema", () => {
    test("should return schema for allowed tables", async () => {
      const response = await fetch(`${BASE_URL}/helicone-sql/schema`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();

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

    test("should return 401 without authentication", async () => {
      const response = await fetch(`${BASE_URL}/helicone-sql/schema`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /helicone-sql/execute", () => {
    test("should execute simple SELECT query", async () => {
      const requestBody = { sql: "SELECT * FROM request_response_rmt LIMIT 5" };

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);
      const result = await response.json();

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    test("should execute query with WHERE clause", async () => {
      const requestBody = {
        sql: "SELECT request_id, model FROM request_response_rmt WHERE model = 'stardust' LIMIT 3",
      };

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);
      const result = await response.json();

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // All results should be stardust model
      result.data?.forEach((row: any) => {
        expect(row.model).toBe("stardust");
      });
    });

    test("should execute query with aggregation", async () => {
      const requestBody = {
        sql: "SELECT model, COUNT(*) as count FROM request_response_rmt GROUP BY model",
      };

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);
      const result = await response.json();

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // Should have results for stardust model
      const models = result.data?.map((row: any) => row.model) || [];
      expect(models).toContain("stardust");
    });
  });

  describe("POST /helicone-sql/execute - Organization Isolation", () => {
    test("should only return data for the authenticated organization", async () => {
      const requestBody = {
        sql: "SELECT organization_id, COUNT(*) as count FROM request_response_rmt GROUP BY organization_id",
      };

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);
      const result = await response.json();

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // Should only have data for the test organization
      result.data?.forEach((row: any) => {
        expect(row.organization_id).toBe(TEST_ORG_ID);
      });
    });

    test("should not leak data from other organizations", async () => {
      const requestBody = {
        sql: "SELECT * FROM request_response_rmt ORDER BY request_created_at DESC LIMIT 10",
      };

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);
      const result = await response.json();

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();

      // All results should belong to the test organization
      result.data?.forEach((row: any) => {
        expect(row.organization_id).toBe(TEST_ORG_ID);
      });
    });
  });

  describe("POST /helicone-sql/execute - SQL Injection Prevention", () => {
    test("should reject DROP statements", async () => {
      const requestBody = {
        sql: "DROP TABLE request_response_rmt",
      };

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(500);
      const result = await response.json();

      expect(result.error).toBeDefined();
      expect(result.error).toContain("Only select statements");
    });

    test("should reject INSERT statements", async () => {
      const requestBody = {
        sql: "INSERT INTO request_response_rmt (request_id) VALUES ('test')",
      };

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(500);
      const result = await response.json();

      expect(result.error).toBeDefined();
      expect(result.error).toContain("Only select statements");
    });

    test("should reject UPDATE statements", async () => {
      const requestBody = {
        sql: "UPDATE request_response_rmt SET model = 'hacked' WHERE 1=1",
      };

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(500);
      const result = await response.json();

      expect(result.error).toBeDefined();
      expect(result.error).toContain("Only select statements");
    });

    test("should reject DELETE statements", async () => {
      const requestBody = {
        sql: "DELETE FROM request_response_rmt WHERE 1=1",
      };

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(500);
      const result = await response.json();

      expect(result.error).toBeDefined();
      expect(result.error).toContain("Only select statements");
    });

    test("should reject CREATE statements", async () => {
      const requestBody = {
        sql: "CREATE TABLE malicious (id INT)",
      };

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(500);
      const result = await response.json();

      expect(result.error).toBeDefined();
      expect(result.error).toContain("Only select statements");
    });
  });

  describe("POST /helicone-sql/execute - Table Access Control", () => {
    test("should reject queries to unauthorized tables", async () => {
      const requestBody = {
        sql: "SELECT * FROM users",
      };

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(500);
      const result = await response.json();

      expect(result.error).toBeDefined();
      expect(result.error).toContain(
        "Only select statements and tables in CLICKHOUSE_TABLES are allowed"
      );
    });

    test("should reject queries to system tables", async () => {
      const requestBody = {
        sql: "SELECT * FROM system.users",
      };

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(500);
      const result = await response.json();

      expect(result.error).toBeDefined();
      expect(result.error).toContain(
        "Only select statements and tables in CLICKHOUSE_TABLES are allowed"
      );
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

        const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            "Helicone-Organization-Id": TEST_ORG_ID,
          },
          body: JSON.stringify(requestBody),
        });

        expect(response.status).toBe(200);
        const result = await response.json();

        expect(result.error).toBeNull();
        expect(result.data).toBeDefined();
      }
    });
  });

  describe("POST /helicone-sql/execute - Complex Queries", () => {
    test("should handle JOIN queries", async () => {
      const requestBody = {
        sql: `
          SELECT r.request_id, r.model, t.tag 
          FROM request_response_rmt r 
          LEFT JOIN tags t ON r.request_id = t.entity_id 
          WHERE r.model = 'stardust' 
          LIMIT 5
        `,
      };

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);
      const result = await response.json();

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

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);
      const result = await response.json();

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

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);
      const result = await response.json();

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe("POST /helicone-sql/execute - Error Handling", () => {
    test("should handle malformed SQL", async () => {
      const requestBody = {
        sql: "SELECT * FROM request_response_rmt WHERE invalid_column = 'test'",
      };

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(500);
      const result = await response.json();

      expect(result.error).toBeDefined();
    });

    test("should handle empty SQL", async () => {
      const requestBody = {
        sql: "",
      };

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(500);
      const result = await response.json();

      expect(result.error).toBeDefined();
    });

    test("should handle SQL with syntax errors", async () => {
      const requestBody = {
        sql: "SELECT * FROM request_response_rmt WHERE model = 'test",
      };

      const response = await fetch(`${BASE_URL}/helicone-sql/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Helicone-Organization-Id": TEST_ORG_ID,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(500);
      const result = await response.json();

      expect(result.error).toBeDefined();
    });
  });
});
