import {
  buildFilter,
  buildFilterClickHouse,
  buildFilterPostgres,
  buildFilterWithAuth,
  buildFilterWithAuthClickHouse,
  buildFilterWithAuthClickHouseCacheMetrics,
  clickhouseParam,
  FilterValidationError,
  validateFilterNode,
} from "../../filters/filters";
import { FilterNode } from "../../filters/filterDefs";

const ORG_ID = "00000000-0000-0000-0000-00000000000a";
const ORG_CLAUSE = "request_response_rmt.organization_id = {val_0 : String}";

// Request bodies arrive as parsed JSON, so build payloads the same way.
const fromJson = (json: string): any => JSON.parse(json);

const chAuth = (filter: unknown) =>
  buildFilterWithAuthClickHouse({
    org_id: ORG_ID,
    filter: filter as FilterNode,
    argsAcc: [],
  });

describe("filter builder injection hardening", () => {
  describe("prototype keys as table names", () => {
    const payloads: Record<string, string> = {
      constructor:
        '{"constructor":{"column":"1=1 OR 1","operator":"equals","value":"1"}}',
      __proto__:
        '{"__proto__":{"column":"1=1 OR 1","operator":"equals","value":"1"}}',
      toString:
        '{"toString":{"column":"1=1 OR 1","operator":"equals","value":"1"}}',
      hasOwnProperty: '{"hasOwnProperty":{"model":{"equals":"x"}}}',
      valueOf: '{"valueOf":{"model":{"equals":"x"}}}',
    };

    test.each(Object.entries(payloads))(
      "%s table key is rejected by buildFilterWithAuthClickHouse",
      async (_name, json) => {
        await expect(chAuth(fromJson(json))).rejects.toThrow(
          FilterValidationError
        );
      }
    );

    test.each(Object.entries(payloads))(
      "%s table key is rejected by the low-level builder too",
      (_name, json) => {
        expect(() =>
          buildFilter({
            filter: fromJson(json),
            argsAcc: [],
            argPlaceHolder: clickhouseParam,
          })
        ).toThrow(FilterValidationError);
        expect(() =>
          buildFilter({
            filter: fromJson(json),
            argsAcc: [],
            having: true,
            argPlaceHolder: clickhouseParam,
          })
        ).toThrow(FilterValidationError);
      }
    );

    test("constructor payload nested in a branch is rejected", async () => {
      const filter = fromJson(
        '{"left":{"request_response_rmt":{"model":{"equals":"gpt-4"}}},"operator":"and","right":{"constructor":{"column":"1=1 OR 1","operator":"equals","value":"1"}}}'
      );
      await expect(chAuth(filter)).rejects.toThrow(FilterValidationError);
    });
  });

  describe("prototype keys as column names", () => {
    test.each(["constructor", "__proto__", "toString", "valueOf"])(
      "%s column is rejected",
      async (column) => {
        const filter = fromJson(
          `{"request_response_rmt":{"${column}":{"equals":"x"}}}`
        );
        await expect(chAuth(filter)).rejects.toThrow(FilterValidationError);
        expect(() =>
          buildFilter({
            filter,
            argsAcc: [],
            having: true,
            argPlaceHolder: clickhouseParam,
          })
        ).toThrow(FilterValidationError);
      }
    );

    test("unknown table is rejected", async () => {
      await expect(
        chAuth({ organization: { id: { equals: "x" } } })
      ).rejects.toThrow(FilterValidationError);
    });

    test("unknown column is rejected", async () => {
      await expect(
        chAuth({ request_response_rmt: { "1=1 OR 1": { equals: "x" } } })
      ).rejects.toThrow(FilterValidationError);
    });
  });

  describe("operators", () => {
    test.each([
      "= 1 OR 1 =",
      "constructor",
      "__proto__",
      "toString",
      "invalid-operator",
      // internal-only operators must not be accepted from input
      "has",
      "gin-contains",
      "vector-contains",
    ])("operator %p is rejected", async (operator) => {
      const filter = fromJson(
        JSON.stringify({ request_response_rmt: { model: { [operator]: "x" } } })
      );
      await expect(chAuth(filter)).rejects.toThrow(FilterValidationError);
    });

    test("unknown operator under properties map is rejected", async () => {
      await expect(
        chAuth({
          request_response_rmt: {
            properties: { env: { "OR 1=1": "prod" } },
          },
        })
      ).rejects.toThrow(FilterValidationError);
    });

    test("empty operator object is rejected", async () => {
      await expect(
        chAuth({ request_response_rmt: { model: {} } })
      ).rejects.toThrow(FilterValidationError);
    });

    test("injected branch operator is rejected", async () => {
      await expect(
        chAuth({
          left: { request_response_rmt: { model: { equals: "a" } } },
          operator: "or 1=1 or",
          right: { request_response_rmt: { model: { equals: "b" } } },
        })
      ).rejects.toThrow(FilterValidationError);
    });

    test("object values are rejected", async () => {
      await expect(
        chAuth({ request_response_rmt: { model: { equals: { x: 1 } } } })
      ).rejects.toThrow(FilterValidationError);
      await expect(
        chAuth({ request_response_rmt: { model: { equals: ["a"] } } })
      ).rejects.toThrow(FilterValidationError);
    });
  });

  describe("malformed nodes", () => {
    test.each([
      ["null", null],
      ["number", 1],
      ["string", "1=1"],
      ["array", [{ request_response_rmt: { model: { equals: "x" } } }]],
      [
        "branch with extra key",
        {
          left: "all",
          operator: "and",
          right: "all",
          request_response_rmt: { model: { equals: "x" } },
        },
      ],
      ["branch missing right", { left: "all", operator: "and" }],
      ["table value not an object", { request_response_rmt: "1=1" }],
    ])("%s is rejected", async (_name, filter) => {
      await expect(chAuth(filter)).rejects.toThrow(FilterValidationError);
      expect(() => validateFilterNode(filter)).toThrow(FilterValidationError);
    });
  });

  describe("org scope cannot be escaped", () => {
    test("user OR filter is parenthesised under the org predicate", async () => {
      const result = await chAuth({
        left: { request_response_rmt: { model: { equals: "a" } } },
        operator: "or",
        right: { request_response_rmt: { model: { equals: "b" } } },
      });

      expect(result.filter).toBe(
        `(${ORG_CLAUSE}) AND ((request_response_rmt.model = {val_1 : String} or request_response_rmt.model = {val_2 : String}))`
      );
      expect(result.argsAcc).toEqual([ORG_ID, "a", "b"]);
    });

    test("'all' filter keeps the org predicate", async () => {
      const result = await chAuth("all");
      expect(result.filter).toBe(`(${ORG_CLAUSE}) AND (true)`);
      expect(result.argsAcc).toEqual([ORG_ID]);
    });

    test("SQL in property keys and values only reaches query params", async () => {
      const key = "x') OR 1=1 --";
      const value = "' OR 1=1 --";
      const result = await chAuth({
        request_response_rmt: { properties: { [key]: { equals: value } } },
      });

      expect(result.filter).toBe(
        `(${ORG_CLAUSE}) AND (request_response_rmt.properties[{val_1 : String}] = {val_2 : String})`
      );
      expect(result.filter).not.toContain("1=1");
      expect(result.argsAcc).toEqual([ORG_ID, key, value]);
    });

    test("a second organization_id predicate is ANDed, not substituted", async () => {
      const result = await chAuth({
        request_response_rmt: {
          model: { equals: "a" },
          organization_id: { equals: "other-org" },
        },
      });

      expect(result.filter).toBe(
        `(${ORG_CLAUSE}) AND (request_response_rmt.model = {val_1 : String} AND request_response_rmt.organization_id = {val_2 : String})`
      );
      expect(result.argsAcc).toEqual([ORG_ID, "a", "other-org"]);
    });

    test("postgres auth filter wraps the user filter", async () => {
      const result = await buildFilterWithAuth({
        org_id: ORG_ID,
        argsAcc: [],
        filter: {
          left: { request: { model: { equals: "a" } } },
          operator: "or",
          right: { request: { user_id: { equals: "u" } } },
        },
      });

      expect(result.filter).toBe(
        "(request.helicone_org_id = $1) AND ((request.model = $2 or request.user_id = $3))"
      );
      expect(result.argsAcc).toEqual([ORG_ID, "a", "u"]);
    });

    test("cache metrics auth filter wraps the user filter", async () => {
      const result = await buildFilterWithAuthClickHouseCacheMetrics({
        org_id: ORG_ID,
        argsAcc: [],
        filter: {
          left: { cache_metrics: { model: { equals: "a" } } },
          operator: "or",
          right: { cache_metrics: { model: { equals: "b" } } },
        },
      });

      expect(result.filter).toBe(
        "(cache_metrics.organization_id = {val_0 : String}) AND ((cache_metrics.model = {val_1 : String} or cache_metrics.model = {val_2 : String}))"
      );
    });

    test("injection payload never reaches generated SQL", async () => {
      const payload = "1=1 OR 1";
      const attempts: unknown[] = [
        { constructor: { column: payload, operator: "equals", value: "1" } },
        { request_response_rmt: { [payload]: { equals: "1" } } },
        { request_response_rmt: { model: { [payload]: "1" } } },
      ];
      for (const attempt of attempts) {
        let sql: string | undefined;
        try {
          sql = (await chAuth(fromJson(JSON.stringify(attempt)))).filter;
        } catch (e) {
          expect(e).toBeInstanceOf(FilterValidationError);
        }
        expect(sql ?? "").not.toContain(payload);
      }
    });
  });

  describe("valid filters still build", () => {
    test("multiple operators on one column are all applied", () => {
      const result = buildFilterClickHouse({
        filter: {
          request_response_rmt: {
            latency: { gte: 10, lte: 20 },
          },
        },
        argsAcc: [],
      });
      expect(result.filter).toBe(
        "request_response_rmt.latency >= {val_0 : Int32} AND request_response_rmt.latency <= {val_1 : Int32}"
      );
    });

    test("having-only columns are skipped in WHERE and applied in HAVING", () => {
      const filter: FilterNode = {
        users_view: { user_total_requests: { gt: 5 } },
      };
      expect(buildFilterClickHouse({ filter, argsAcc: [] }).filter).toBe(
        "true"
      );
      expect(
        buildFilterClickHouse({ filter, argsAcc: [], having: true }).filter
      ).toBe("total_requests > {val_0 : Int32}");
    });

    test("legacy UI session columns are accepted and ignored", () => {
      const result = buildFilterClickHouse({
        filter: fromJson(
          '{"sessions_request_response_rmt":{"total_requests":{"gt":1}}}'
        ),
        argsAcc: [],
        having: true,
      });
      expect(result.filter).toBe("true");
    });

    test("properties table keys are parameterised", () => {
      const result = buildFilterPostgres({
        filter: { properties: { "my key": { "not-equals": "v" } } },
        argsAcc: [],
      });
      expect(result.filter).toBe("properties ->> $1 != $2");
      expect(result.argsAcc).toEqual(["my key", "v"]);
    });

    test("cached and cost special columns still work", () => {
      const result = buildFilterClickHouse({
        filter: {
          left: { request_response_rmt: { cached: { equals: true } } },
          operator: "and",
          right: { request_response_rmt: { cost: { gte: 1 } } },
        },
        argsAcc: [],
      });
      expect(result.filter).toBe(
        "(request_response_rmt.cache_reference_id != {val_0 : String} and request_response_rmt.cost >= {val_1 : Int32})"
      );
    });
  });
});
