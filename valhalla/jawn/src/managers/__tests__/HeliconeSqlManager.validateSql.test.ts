import { describe, expect, test } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";
import {
  skeletonizeSql,
  validateSql,
} from "../HeliconeSqlManager";
import { isError } from "../../packages/common/result";

const OTHER_ORG = "048e409c-f6e1-4533-94fc-8e873e295045";

function expectRejected(sql: string, messageFragment?: string) {
  const result = validateSql(sql);
  expect(isError(result)).toBe(true);
  if (messageFragment && isError(result)) {
    const text = `${result.error.message} ${result.error.details ?? ""}`;
    expect(text.toLowerCase()).toContain(messageFragment.toLowerCase());
  }
}

function expectAccepted(sql: string) {
  const result = validateSql(sql);
  if (isError(result)) {
    throw new Error(
      `Expected query to be accepted but got: ${result.error.message} ${result.error.details ?? ""}\n${sql}`
    );
  }
}

describe("HQL validateSql - cross-tenant bypass regressions", () => {
  test("rejects backtick-quoted table functions (mergeTreeIndex enumeration)", () => {
    expectRejected(
      "SELECT count() AS index_rows, countDistinct(organization_id) AS discovered_orgs FROM `mergeTreeIndex`('default', 'request_response_rmt') LIMIT 1",
      "quoted identifiers"
    );
  });

  test("rejects unquoted table functions after FROM", () => {
    expectRejected(
      "SELECT DISTINCT toString(organization_id) FROM mergeTreeIndex('default', 'request_response_rmt') LIMIT 1"
    );
    expectRejected("SELECT * FROM MERGETREEINDEX('default', 'request_response_rmt')");
    expectRejected("SELECT * FROM/**/mergeTreeIndex('default','request_response_rmt')");
    expectRejected("SELECT * FROM numbers(10)");
    expectRejected("SELECT * FROM url('http://169.254.169.254/', 'RawBLOB')");
  });

  test("rejects table functions in comma joins and parenthesised positions", () => {
    expectRejected(
      "SELECT * FROM request_response_rmt, mergeTreeIndex('default', 'request_response_rmt')",
      "mergeTreeIndex"
    );
    expectRejected(
      "SELECT * FROM (mergeTreeIndex('default', 'request_response_rmt'))"
    );
    expectRejected(
      "SELECT * FROM request_response_rmt r JOIN (mergeTreeIndex('default','request_response_rmt')) m ON 1 = 1"
    );
  });

  test("rejects the escaped setting name inside a backtick identifier", () => {
    expectRejected(
      `SELECT (SELECT count() FROM request_response_rmt SETTINGS \`SQL_helicone_organization_\\x69d\` = '${OTHER_ORG}') AS cross_tenant_rows LIMIT 1`
    );
  });

  test("rejects any SETTINGS clause, including in subqueries", () => {
    expectRejected(
      `SELECT * FROM request_response_rmt SETTINGS SQL_helicone_organization_id = '${OTHER_ORG}'`,
      "SETTINGS"
    );
    expectRejected(
      `SELECT * FROM (SELECT * FROM request_response_rmt SETTINGS max_threads = 1)`,
      "SETTINGS"
    );
    expectRejected(
      `SELECT * FROM request_response_rmt settings max_threads = 1`,
      "SETTINGS"
    );
  });

  test("rejects SETTINGS hidden behind a fake comment inside a string literal", () => {
    // `--` is inside a string literal here, so ClickHouse would execute the
    // SETTINGS clause; a naive comment stripper would hide it from validation.
    expectRejected(
      `SELECT * FROM request_response_rmt WHERE model = '--' SETTINGS SQL_helicone_organization_id = '${OTHER_ORG}'`,
      "SETTINGS"
    );
  });

  test("rejects double-quoted identifiers, heredocs and # comments", () => {
    expectRejected(`SELECT * FROM "mergeTreeIndex"('default', 'request_response_rmt')`);
    expectRejected(`SELECT $$'$$ FROM request_response_rmt`);
    expectRejected(`SELECT * FROM request_response_rmt # SETTINGS x = 1`);
  });

  test("rejects database-qualified and system tables", () => {
    expectRejected("SELECT * FROM default.request_response_rmt");
    expectRejected("SELECT * FROM system.tables");
    expectRejected("SELECT * FROM system.row_policies");
    expectRejected("SELECT * FROM information_schema.tables");
  });

  test("rejects multiple statements and non-SELECT statements", () => {
    expectRejected("SELECT 1; SELECT * FROM system.tables");
    expectRejected(`SET SQL_helicone_organization_id = '${OTHER_ORG}'; SELECT * FROM request_response_rmt`);
    expectRejected("WITH x AS (SELECT 1) SELECT * FROM request_response_rmt");
    expectRejected("INSERT INTO request_response_rmt SELECT * FROM request_response_rmt");
    expectRejected("DROP TABLE request_response_rmt");
  });

  test("rejects unterminated literals and comments", () => {
    expectRejected("SELECT * FROM request_response_rmt WHERE model = 'abc");
    expectRejected("SELECT * FROM request_response_rmt /* never closed");
  });
});

describe("HQL validateSql - legitimate queries still pass", () => {
  test("accepts plain analytics queries", () => {
    expectAccepted("SELECT model, count() AS c FROM request_response_rmt GROUP BY model ORDER BY c DESC LIMIT 100");
    expectAccepted("select * from request_response_rmt final where status = 200 limit 10;");
    expectAccepted(
      "SELECT request_id, properties['Helicone-Session-Id'] AS session FROM request_response_rmt WHERE properties['env'] = 'prod'"
    );
  });

  test("accepts comments and string literals containing scary words", () => {
    expectAccepted(`
      -- query FROM system.tables SETTINGS should be ignored in comments
      SELECT model /* DROP TABLE mergeTreeIndex() */
      FROM request_response_rmt
      WHERE request_body LIKE '%SETTINGS%' AND response_body != 'FROM system.tables; DROP TABLE x'
    `);
    expectAccepted(`SELECT * FROM request_response_rmt WHERE model = 'it\\'s' OR model = 'it''s' OR model = '$$'`);
  });

  test("accepts subqueries and self joins", () => {
    expectAccepted(
      "SELECT * FROM (SELECT model, count() c FROM request_response_rmt GROUP BY model) WHERE c > 10"
    );
    expectAccepted(
      "SELECT a.model FROM request_response_rmt a LEFT JOIN request_response_rmt b ON a.request_id = b.request_id"
    );
    expectAccepted(
      "SELECT a.model FROM request_response_rmt a JOIN ((SELECT request_id FROM request_response_rmt)) b ON a.request_id = b.request_id"
    );
  });

  test("accepts SQL-standard FROM inside scalar functions", () => {
    expectAccepted("SELECT substring(model FROM 1 FOR 3) FROM request_response_rmt");
  });

  test("accepts every example query shipped with the HQL UI", () => {
    const constantsPath = path.resolve(
      __dirname,
      "../../../../../web/components/templates/hql/constants.ts"
    );
    if (!fs.existsSync(constantsPath)) {
      return;
    }
    const source = fs.readFileSync(constantsPath, "utf8");
    const examples = [...source.matchAll(/sql:\s*`([\s\S]*?)`/g)].map((m) => m[1]);
    expect(examples.length).toBeGreaterThan(0);
    for (const sql of examples) {
      expectAccepted(sql);
    }
  });
});

describe("skeletonizeSql", () => {
  test("blanks literals and comments but keeps structure", () => {
    const result = skeletonizeSql(
      "SELECT 'a''b\\'c' -- comment\n FROM /* block */ request_response_rmt;"
    );
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.data.replace(/\s+/g, " ").trim()).toBe(
        "SELECT '' FROM request_response_rmt"
      );
    }
  });
});
