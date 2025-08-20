import { describe, it, expect } from "@jest/globals";
import { MockClickhouseClientWrapper } from "./MockClickhouseWrapper";

describe("HQL Security Tests", () => {
  let clickhouse: MockClickhouseClientWrapper;
  const testOrgId = "1c6c26f4-d1bd-423c-ba6f-b3375a04fdd0";
  const maliciousOrgId = "99999999-9999-9999-9999-999999999999";

  clickhouse = new MockClickhouseClientWrapper();

  describe("Settings Override Prevention", () => {
    it("should block queries with SETTINGS clause", async () => {
      const maliciousQuery = `
        SELECT * FROM request_response_rmt 
        SETTINGS SQL_helicone_organization_id = '${maliciousOrgId}'
      `;

      const result = await clickhouse.queryWithContext({
        query: maliciousQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error when trying to override settings
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block multi-statement queries", async () => {
      const maliciousQuery = `
        SET SQL_helicone_organization_id = '${maliciousOrgId}';
        SELECT * FROM request_response_rmt;
      `;

      const result = await clickhouse.queryWithContext({
        query: maliciousQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error on multi-statement queries
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });
  });

  describe("SQL Injection Prevention", () => {
    it("should block DROP TABLE attempts", async () => {
      const maliciousQuery = `
        SELECT * FROM request_response_rmt WHERE user_id = ''; 
        DROP TABLE request_response_rmt; --'
      `;

      const result = await clickhouse.queryWithContext({
        query: maliciousQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error on DROP TABLE attempt
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block ALTER TABLE attempts", async () => {
      const maliciousQuery = `
        SELECT * FROM request_response_rmt;
        ALTER TABLE request_response_rmt ADD COLUMN malicious String;
      `;

      const result = await clickhouse.queryWithContext({
        query: maliciousQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error on ALTER TABLE attempt
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block INSERT attempts in multi-statement", async () => {
      const maliciousQuery = `
        SELECT * FROM request_response_rmt;
        INSERT INTO request_response_rmt VALUES ('malicious data');
      `;

      const result = await clickhouse.queryWithContext({
        query: maliciousQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error on INSERT attempt
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block single INSERT statement", async () => {
      const maliciousQuery = `INSERT INTO request_response_rmt (organization_id) VALUES ('${maliciousOrgId}')`;

      const result = await clickhouse.queryWithContext({
        query: maliciousQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - readonly mode prevents INSERT
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block DELETE attempts", async () => {
      const maliciousQuery = `DELETE FROM request_response_rmt WHERE 1=1`;

      const result = await clickhouse.queryWithContext({
        query: maliciousQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - readonly mode prevents DELETE
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block UPDATE attempts", async () => {
      const maliciousQuery = `UPDATE request_response_rmt SET organization_id = '${maliciousOrgId}'`;

      const result = await clickhouse.queryWithContext({
        query: maliciousQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - readonly mode prevents UPDATE
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });
  });

  describe("System Table Access Prevention", () => {
    it.skip("should block access to system.tables", async () => {
      // SKIPPED: In test environment, hql_user may have limited access to system tables
      // In production, ensure proper REVOKE statements are executed
      const query = "SELECT * FROM system.tables";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should either error OR return empty/no results (depending on permissions)
      const isBlocked = result.error || !result.data || result.data.length === 0;
      expect(isBlocked).toBeTruthy();
    });

    it.skip("should block access to system.columns", async () => {
      // SKIPPED: In test environment, hql_user may have limited access to system tables
      // In production, ensure proper REVOKE statements are executed
      const query = "SELECT * FROM system.columns WHERE table = 'request_response_rmt'";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should either error OR return empty/no results (depending on permissions)
      const isBlocked = result.error || !result.data || result.data.length === 0;
      expect(isBlocked).toBeTruthy();
    });

    it("should block access to information_schema", async () => {
      const query = "SELECT * FROM information_schema.tables";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - no access to information_schema
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block access to system.users", async () => {
      const query = "SELECT * FROM system.users";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - no access to system.users
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block access to system.grants", async () => {
      const query = "SELECT * FROM system.grants";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - no access to system.grants
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block access to system.row_policies", async () => {
      const query = "SELECT * FROM system.row_policies";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - no access to system.row_policies
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });
  });

  describe("Function Abuse Prevention", () => {
    it("should block file() function", async () => {
      const maliciousQuery = "SELECT * FROM file('/etc/passwd', 'CSV')";

      const result = await clickhouse.queryWithContext({
        query: maliciousQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - dangerous function blocked
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block url() function", async () => {
      const maliciousQuery = "SELECT * FROM url('http://evil.com/steal', 'CSV')";

      const result = await clickhouse.queryWithContext({
        query: maliciousQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - dangerous function blocked
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block odbc() function", async () => {
      const maliciousQuery = "SELECT * FROM odbc('DSN=mydb', 'schema', 'table')";

      const result = await clickhouse.queryWithContext({
        query: maliciousQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - dangerous function blocked
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block hdfs() function", async () => {
      const maliciousQuery = "SELECT * FROM hdfs('hdfs://server:9000/path', 'CSV')";

      const result = await clickhouse.queryWithContext({
        query: maliciousQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - dangerous function blocked
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block s3() function", async () => {
      const maliciousQuery = "SELECT * FROM s3('https://bucket.s3.amazonaws.com/key', 'CSV')";

      const result = await clickhouse.queryWithContext({
        query: maliciousQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - dangerous function blocked
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block input() function", async () => {
      const maliciousQuery = "SELECT * FROM input('user String, age Int32')";

      const result = await clickhouse.queryWithContext({
        query: maliciousQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - dangerous function blocked
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block mysql() function", async () => {
      const maliciousQuery = "SELECT * FROM mysql('server:3306', 'db', 'table', 'user', 'pass')";

      const result = await clickhouse.queryWithContext({
        query: maliciousQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - dangerous function blocked
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block postgresql() function", async () => {
      const maliciousQuery = "SELECT * FROM postgresql('server:5432', 'db', 'table', 'user', 'pass')";

      const result = await clickhouse.queryWithContext({
        query: maliciousQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - dangerous function blocked
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });
  });

  describe("Resource Exhaustion Prevention", () => {
    it("should handle sleep() function", async () => {
      const slowQuery = "SELECT sleep(60)";

      const result = await clickhouse.queryWithContext({
        query: slowQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should either timeout or be blocked
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should limit result set size", async () => {
      const largeQuery = "SELECT * FROM request_response_rmt";

      const result = await clickhouse.queryWithContext({
        query: largeQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should either return limited results or error
      if (result.data) {
        expect(result.data.length).toBeLessThanOrEqual(10000);
      }
    });

    it("should prevent excessive memory usage", async () => {
      const memoryIntensiveQuery = `
        SELECT * FROM request_response_rmt AS t1
        CROSS JOIN request_response_rmt AS t2
        CROSS JOIN request_response_rmt AS t3
      `;

      const result = await clickhouse.queryWithContext({
        query: memoryIntensiveQuery,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should either be blocked or return no/empty data due to resource limits
      expect(result.error || !result.data || result.data.length === 0).toBeTruthy();
    });
  });

  describe("DDL Prevention", () => {
    it("should block CREATE TABLE", async () => {
      const query = "CREATE TABLE malicious_table (id Int32) ENGINE = Memory";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - DDL not allowed
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block DROP TABLE", async () => {
      const query = "DROP TABLE request_response_rmt";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - DDL not allowed
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block CREATE VIEW", async () => {
      const query = "CREATE VIEW malicious_view AS SELECT * FROM request_response_rmt";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - DDL not allowed
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block CREATE DATABASE", async () => {
      const query = "CREATE DATABASE malicious_db";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - DDL not allowed
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block DROP DATABASE", async () => {
      const query = "DROP DATABASE default";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - DDL not allowed
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block TRUNCATE TABLE", async () => {
      const query = "TRUNCATE TABLE request_response_rmt";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - DDL not allowed
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block RENAME TABLE", async () => {
      const query = "RENAME TABLE request_response_rmt TO hacked_table";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - DDL not allowed
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });
  });

  describe("Organization Context Validation", () => {
    it("should properly filter by organization", async () => {
      const query = "SELECT DISTINCT organization_id FROM request_response_rmt LIMIT 10";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      if (result.data && result.data.length > 0) {
        // All returned rows should be from the correct org
        result.data.forEach((row: any) => {
          expect(row.organization_id).toBe(testOrgId);
        });
      }
    });

    it("should not leak data from other organizations", async () => {
      const query = `
        SELECT count(*) as cnt FROM request_response_rmt 
        WHERE organization_id != '${testOrgId}'
      `;

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      if (result.data && result.data.length > 0) {
        // Should return 0 rows from other orgs (handle both string and number)
        const count = Number((result.data[0] as any).cnt);
        expect(count).toBe(0);
      }
    });

    it("should maintain org filter with WHERE clause", async () => {
      const query = `
        SELECT organization_id FROM request_response_rmt 
        WHERE status = 200 
        LIMIT 10
      `;

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      if (result.data && result.data.length > 0) {
        // Even with WHERE clause, org filter should apply
        result.data.forEach((row: any) => {
          expect(row.organization_id).toBe(testOrgId);
        });
      }
    });

    it("should maintain org filter with GROUP BY", async () => {
      const query = `
        SELECT organization_id, COUNT(*) as cnt 
        FROM request_response_rmt 
        GROUP BY organization_id
      `;

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      if (result.data && result.data.length > 0) {
        // Should only see one org in grouped results
        expect(result.data.length).toBeLessThanOrEqual(1);
        if (result.data.length === 1) {
          expect((result.data[0] as any).organization_id).toBe(testOrgId);
        }
      }
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

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Comments should be allowed in queries
      // If there's an error, it shouldn't be about comments
      if (result.error) {
        expect(result.error.toLowerCase()).not.toContain("comment");
      }
    });

    it("should handle queries with newlines and tabs", async () => {
      const query = `SELECT\n\t*\n\tFROM\n\trequest_response_rmt\n\tLIMIT 10`;

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Whitespace formatting should work
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

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Subqueries should work with org filtering
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

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // CTEs should work with org filtering
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

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Escaped quotes should work or return empty result
      if (result.error) {
        expect(result.error.toLowerCase()).not.toContain("syntax");
      }
    });

    it("should handle backslashes safely", async () => {
      const query = `SELECT * FROM request_response_rmt WHERE user_id = 'test\\malicious' LIMIT 1`;

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Backslashes should work or return empty result
      if (result.error) {
        expect(result.error.toLowerCase()).not.toContain("syntax");
      }
    });

    it("should handle null bytes safely", async () => {
      const query = `SELECT * FROM request_response_rmt WHERE user_id = 'test\x00malicious' LIMIT 1`;

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should handle null bytes without crashing
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

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error due to lack of access to system.tables
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

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Self-joins should work but maintain org filtering
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

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // LEFT JOIN should work but maintain org filtering
      if (result.data && result.data.length > 0) {
        result.data.forEach((row: any) => {
          if (row.organization_id) {
            expect(row.organization_id).toBe(testOrgId);
          }
        });
      }
    });
  });

  describe("Permission Escalation Prevention", () => {
    it("should block GRANT statements", async () => {
      const query = "GRANT SELECT ON *.* TO hql_user";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - no permission to GRANT
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block REVOKE statements", async () => {
      const query = "REVOKE SELECT ON request_response_rmt FROM hql_user";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - no permission to REVOKE
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block CREATE USER", async () => {
      const query = "CREATE USER hacker IDENTIFIED BY 'password'";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - no permission to create users
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block ALTER USER", async () => {
      const query = "ALTER USER hql_user IDENTIFIED BY 'newpassword'";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - no permission to alter users
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });

    it("should block DROP USER", async () => {
      const query = "DROP USER IF EXISTS hql_user";

      const result = await clickhouse.queryWithContext({
        query,
        organizationId: testOrgId,
        parameters: [],
      });

      // Should error - no permission to drop users
      expect(result.error).toBeTruthy();
      expect(result.data).toBeFalsy();
    });
  });
});