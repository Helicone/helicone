import { beforeEach, describe, expect, jest, test } from "@jest/globals";

jest.mock("../../../lib/shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
  dbQueryClickhouse: jest.fn(),
}));
jest.mock("../../../lib/shared/db/pgpClient", () => ({
  HELICONE_DB: { tx: jest.fn() },
}));
jest.mock("../../../lib/experiment/tempKeys/tempAPIKey", () => ({
  generateTempHeliconeAPIKey: jest.fn(),
}));

import { dbExecute } from "../../../lib/shared/db/dbExecute";
import { HELICONE_DB } from "../../../lib/shared/db/pgpClient";
import { OnlineEvalStore } from "../../../lib/stores/OnlineEvalStore";
import { EvaluatorManager } from "../EvaluatorManager";

const ORG = "11111111-1111-1111-1111-111111111111";
const OWN_EVALUATOR = "eeeeeeee-0000-0000-0000-000000000001";
const FOREIGN_EVALUATOR = "eeeeeeee-0000-0000-0000-000000000002";

const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;
const mockTx = (HELICONE_DB as any).tx as jest.Mock<any>;
const norm = (sql: string) => sql.replace(/\s+/g, " ").trim();

beforeEach(() => {
  mockDbExecute.mockReset();
  mockTx.mockReset();
});

describe("OnlineEvalStore", () => {
  test("createOnlineEvaluator only inserts for an evaluator owned by the org", async () => {
    mockDbExecute.mockResolvedValue({ data: [], error: null });
    const store = new OnlineEvalStore(ORG);
    const result = await store.createOnlineEvaluator(FOREIGN_EVALUATOR, {
      sampleRate: 100,
    });
    expect(result.error).toBe("Evaluator not found");

    const [sql, params] = mockDbExecute.mock.calls[0] as [string, any[]];
    expect(norm(sql)).toContain(
      "FROM evaluator WHERE evaluator.id = $1 AND evaluator.organization_id = $2"
    );
    expect(params[0]).toBe(FOREIGN_EVALUATOR);
    expect(params[1]).toBe(ORG);
  });

  test("createOnlineEvaluator succeeds when a row is inserted", async () => {
    mockDbExecute.mockResolvedValue({ data: [{ id: "x" }], error: null });
    const result = await new OnlineEvalStore(ORG).createOnlineEvaluator(
      OWN_EVALUATOR,
      { sampleRate: 100 }
    );
    expect(result.error).toBeNull();
  });

  test("deleteOnlineEvaluator is scoped by id, evaluator and org", async () => {
    mockDbExecute.mockResolvedValue({ data: [], error: null });
    await new OnlineEvalStore(ORG).deleteOnlineEvaluator("oe-1", OWN_EVALUATOR);
    const [sql, params] = mockDbExecute.mock.calls[0] as [string, any[]];
    expect(norm(sql)).toBe(
      "DELETE FROM online_evaluators WHERE id = $1 AND evaluator = $2 AND organization = $3"
    );
    expect(params).toEqual(["oe-1", OWN_EVALUATOR, ORG]);
  });

  test("getOnlineEvaluatorsByEvaluatorId is scoped by org", async () => {
    mockDbExecute.mockResolvedValue({ data: [], error: null });
    await new OnlineEvalStore(ORG).getOnlineEvaluatorsByEvaluatorId(
      OWN_EVALUATOR
    );
    const [sql, params] = mockDbExecute.mock.calls[0] as [string, any[]];
    expect(norm(sql)).toContain("AND online_evaluators.organization = $2");
    expect(params).toEqual([OWN_EVALUATOR, ORG]);
  });

  test("getOnlineEvalsByOrgId only joins evaluators of the same org", async () => {
    mockDbExecute.mockResolvedValue({ data: [], error: null });
    await new OnlineEvalStore(ORG).getOnlineEvalsByOrgId(ORG);
    const [sql] = mockDbExecute.mock.calls[0] as [string, any[]];
    expect(norm(sql)).toContain(
      "AND evaluator.organization_id = online_evaluators.organization"
    );
  });
});

describe("EvaluatorManager.deleteEvaluator", () => {
  test("does nothing for an evaluator owned by another org", async () => {
    mockDbExecute.mockResolvedValue({ data: [], error: null });
    const result = await new EvaluatorManager({
      organizationId: ORG,
    }).deleteEvaluator(FOREIGN_EVALUATOR);
    expect(result.error).toBe("Evaluator not found");
    expect(mockTx).not.toHaveBeenCalled();
    expect(mockDbExecute).toHaveBeenCalledTimes(1);
  });

  test("deletes owned evaluator in a single scoped transaction", async () => {
    mockDbExecute.mockResolvedValue({
      data: [{ id: OWN_EVALUATOR }],
      error: null,
    });
    const statements: string[] = [];
    mockTx.mockImplementation(async (cb: any) => {
      const t = {
        none: jest.fn(async (sql: string) => {
          statements.push(norm(sql));
        }),
        result: jest.fn(async (sql: string) => {
          statements.push(norm(sql));
          return { rowCount: 1 };
        }),
      };
      return cb(t);
    });

    const result = await new EvaluatorManager({
      organizationId: ORG,
    }).deleteEvaluator(OWN_EVALUATOR);

    expect(result.error).toBeNull();
    expect(mockTx).toHaveBeenCalledTimes(1);
    const v3 = statements.find((s) =>
      s.startsWith("DELETE FROM evaluator_experiments_v3")
    )!;
    expect(v3).toContain("organization_id = $2");
    const v2 = statements.find((s) =>
      s.startsWith("DELETE FROM evaluator_experiments WHERE")
    )!;
    expect(v2).toContain("organization_id = $2");
    expect(statements[statements.length - 1]).toBe(
      "DELETE FROM evaluator WHERE id = $1 AND organization_id = $2"
    );
  });

  test("returns an error when the transaction fails", async () => {
    mockDbExecute.mockResolvedValue({
      data: [{ id: OWN_EVALUATOR }],
      error: null,
    });
    mockTx.mockRejectedValue(new Error("boom") as never);
    const result = await new EvaluatorManager({
      organizationId: ORG,
    }).deleteEvaluator(OWN_EVALUATOR);
    expect(result.error).toMatch(/Failed to delete evaluator/);
  });
});
