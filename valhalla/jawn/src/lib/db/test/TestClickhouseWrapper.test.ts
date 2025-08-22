import { describe, it, expect, beforeEach } from "@jest/globals";
import { MockClickhouseClientWrapper } from "./MockClickhouseWrapper";
import { mockRequestResponseData } from "./clickhouseMockData";

describe("TestClickhouseWrapper Unit Tests", () => {
  let wrapper: MockClickhouseClientWrapper;

  beforeEach(() => {
    // Create a fresh mock wrapper for each test
    wrapper = new MockClickhouseClientWrapper();
  });

  describe("Database Setup Methods", () => {
    it("should successfully create test database", async () => {
      const result = await wrapper.createTestDatabase();
      
      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it("should successfully drop test database", async () => {
      const result = await wrapper.dropTestDatabase();
      
      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it("should successfully create tables", async () => {
      const result = await wrapper.createTables();
      
      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it("should successfully drop tables", async () => {
      const result = await wrapper.dropTables();
      
      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it("should successfully insert test data", async () => {
      const result = await wrapper.insertTestData();
      
      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });
  });

  describe("Query Execution", () => {
    it("should execute basic SELECT query", async () => {
      const result = await wrapper.dbQuery<any>(
        "SELECT * FROM request_response_rmt LIMIT 5",
        []
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      // Mock data has 7 items, but since we don't apply LIMIT in dbQuery (only in queryWithContext), 
      // we get all data. This is expected behavior for the mock.
      expect(result.data?.length).toBeGreaterThan(0);
    });

    it("should execute HQL query with same behavior as regular query", async () => {
      const query = "SELECT * FROM request_response_rmt LIMIT 3";
      const params: any[] = [];

      const regularResult = await wrapper.dbQuery<any>(query, params);
      const hqlResult = await wrapper.dbQueryHql<any>(query, params);

      expect(regularResult.error).toEqual(hqlResult.error);
      expect(regularResult.data).toEqual(hqlResult.data);
    });

    it("should block DDL operations in readonly mode", async () => {
      const result = await wrapper.dbQuery<any>(
        "CREATE TABLE test_table (id INT)",
        []
      );

      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
      expect(result.error).toContain("DDL operations are not allowed");
    });

    it("should block DML operations in readonly mode", async () => {
      const result = await wrapper.dbQuery<any>(
        "INSERT INTO request_response_rmt (request_id) VALUES ('test')",
        []
      );

      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
      expect(result.error).toContain("readonly mode");
    });
  });

  describe("Query with Organization Context", () => {
    const testOrgId = "1c6c26f4-d1bd-423c-ba6f-b3375a04fdd0";
    const otherOrgId = "99999999-9999-9999-9999-999999999999";

    it("should filter data by organization ID", async () => {
      const result = await wrapper.queryWithContext<any>({
        query: "SELECT * FROM request_response_rmt",
        organizationId: testOrgId,
        parameters: [],
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      
      // All results should belong to the test organization
      result.data?.forEach((row: any) => {
        if (row.organization_id) {
          expect(row.organization_id).toBe(testOrgId);
        }
      });
    });

    it("should not return data from other organizations", async () => {
      const result = await wrapper.queryWithContext<any>({
        query: `SELECT * FROM request_response_rmt WHERE organization_id = '${otherOrgId}'`,
        organizationId: testOrgId,
        parameters: [],
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      // Row-level security should filter out all results
      expect(result.data?.length).toBe(0);
    });

    it("should handle COUNT queries with organization filtering", async () => {
      const result = await wrapper.queryWithContext<any>({
        query: `SELECT count(*) as cnt FROM request_response_rmt WHERE organization_id != '${testOrgId}'`,
        organizationId: testOrgId,
        parameters: [],
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0].cnt).toBe(0);
    });

    it("should handle GROUP BY with organization filtering", async () => {
      const result = await wrapper.queryWithContext<any>({
        query: "SELECT organization_id, COUNT(*) as cnt FROM request_response_rmt GROUP BY organization_id",
        organizationId: testOrgId,
        parameters: [],
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      
      // Should only see one organization in results
      if (result.data && result.data.length > 0) {
        expect(result.data.length).toBe(1);
        expect(result.data[0].organization_id).toBe(testOrgId);
      }
    });

    it("should handle DISTINCT queries", async () => {
      const result = await wrapper.queryWithContext<any>({
        query: "SELECT DISTINCT organization_id FROM request_response_rmt",
        organizationId: testOrgId,
        parameters: [],
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      
      // Should only return the current org
      if (result.data && result.data.length > 0) {
        expect(result.data.length).toBe(1);
        expect(result.data[0].organization_id).toBe(testOrgId);
      }
    });

    it("should respect LIMIT clause", async () => {
      const limit = 2;
      const result = await wrapper.queryWithContext<any>({
        query: `SELECT * FROM request_response_rmt LIMIT ${limit}`,
        organizationId: testOrgId,
        parameters: [],
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBeLessThanOrEqual(limit);
    });
  });

  describe("Security Validation", () => {
    const testOrgId = "1c6c26f4-d1bd-423c-ba6f-b3375a04fdd0";

    it("should block queries containing SQL_helicone_organization_id", async () => {
      const result = await wrapper.queryWithContext<any>({
        query: "SELECT * FROM request_response_rmt SETTINGS SQL_helicone_organization_id = 'malicious'",
        organizationId: testOrgId,
        parameters: [],
      });

      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
      expect(result.error).toContain("SQL_helicone_organization_id");
    });

    it("should block multi-statement queries", async () => {
      const result = await wrapper.queryWithContext<any>({
        query: "SELECT * FROM request_response_rmt; DROP TABLE users;",
        organizationId: testOrgId,
        parameters: [],
      });

      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
      expect(result.error).toContain("Multi-statement");
    });

    it("should block access to system tables", async () => {
      const result = await wrapper.queryWithContext<any>({
        query: "SELECT * FROM system.users",
        organizationId: testOrgId,
        parameters: [],
      });

      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
      expect(result.error).toContain("system.users");
    });

    it("should block dangerous table functions", async () => {
      const dangerousFunctions = ["file", "url", "s3", "hdfs"];
      
      for (const func of dangerousFunctions) {
        const result = await wrapper.queryWithContext<any>({
          query: `SELECT * FROM ${func}('/path/to/file', 'CSV')`,
          organizationId: testOrgId,
          parameters: [],
        });

        expect(result.error).toBeTruthy();
        expect(result.data).toBeNull();
        expect(result.error).toContain("table function");
      }
    });

    it("should block user management operations", async () => {
      const operations = [
        "CREATE USER test_user",
        "ALTER USER test_user",
        "DROP USER test_user",
      ];

      for (const op of operations) {
        const result = await wrapper.queryWithContext<any>({
          query: op,
          organizationId: testOrgId,
          parameters: [],
        });

        expect(result.error).toBeTruthy();
        expect(result.data).toBeNull();
      }
    });

    it("should block permission management operations", async () => {
      const operations = [
        "GRANT SELECT ON *.* TO user",
        "REVOKE SELECT ON *.* FROM user",
      ];

      for (const op of operations) {
        const result = await wrapper.queryWithContext<any>({
          query: op,
          organizationId: testOrgId,
          parameters: [],
        });

        expect(result.error).toBeTruthy();
        expect(result.data).toBeNull();
      }
    });
  });

  describe("Insert Operations", () => {
    it("should block inserts in readonly mode", async () => {
      const result = await wrapper.dbInsertClickhouse(
        "request_response_rmt",
        [
          {
            response_id: "test-id",
            organization_id: "test-org",
          } as any,
        ]
      );

      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
      expect(result.error).toContain("readonly mode");
    });
  });

  describe("Data Integrity", () => {
    it("should return consistent mock data", async () => {
      const result1 = await wrapper.dbQuery<any>(
        "SELECT * FROM request_response_rmt",
        []
      );
      
      const result2 = await wrapper.dbQuery<any>(
        "SELECT * FROM request_response_rmt",
        []
      );

      expect(result1.data).toEqual(result2.data);
    });

    it("should handle empty table queries", async () => {
      const result = await wrapper.dbQuery<any>(
        "SELECT * FROM non_existent_table",
        []
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(0);
    });

    it("should extract table names correctly", async () => {
      const queries = [
        "SELECT * FROM request_response_rmt",
        "SELECT * FROM `request_response_rmt`",
        "SELECT * FROM request_response_rmt WHERE id = 1",
        "SELECT * FROM request_response_rmt AS t1",
      ];

      for (const query of queries) {
        const result = await wrapper.dbQuery<any>(query, []);
        
        expect(result.error).toBeNull();
        expect(result.data).toBeDefined();
        // Should get data from the mock table
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});