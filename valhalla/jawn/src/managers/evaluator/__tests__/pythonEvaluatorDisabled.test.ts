import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";

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
jest.mock("../../../lib/clients/redisClient", () => ({ redisClient: null }));
// The real KVCache starts a cleanup interval that keeps jest from exiting.
jest.mock("../../../lib/cache/kvCache", () => ({
  KVCache: class {
    private store = new Map<string, unknown>();
    async get(key: string) {
      return this.store.get(key) ?? null;
    }
    async set(key: string, value: unknown) {
      this.store.set(key, value);
    }
  },
}));
jest.mock("../../../lib/handlers/HandlerContext", () => ({
  toHeliconeRequest: jest.fn(() => ({})),
}));

import { EvaluatorController } from "../../../controllers/public/evaluatorController";
import { OnlineEvalHandler } from "../../../lib/handlers/OnlineEvalHandler";
import { dbExecute } from "../../../lib/shared/db/dbExecute";
import { ok } from "../../../packages/common/result";
import { EvaluatorManager } from "../EvaluatorManager";
import {
  isPythonEvaluator,
  PYTHON_EVALUATORS_UNSUPPORTED_MESSAGE,
} from "../pythonEvaluator";

const ORG = "11111111-1111-1111-1111-111111111111";
const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;

const pythonEvaluatorRow = {
  id: "eeeeeeee-0000-0000-0000-000000000001",
  created_at: "2025-01-01",
  scoring_type: "PYTHON",
  llm_template: null,
  organization_id: ORG,
  updated_at: "2025-01-01",
  name: "py eval",
  code_template: { code: "print(1)" },
  last_mile_config: null,
};

function req() {
  return { authParams: { organizationId: ORG } } as any;
}

let logSpy: jest.SpiedFunction<typeof console.log>;
let errorSpy: jest.SpiedFunction<typeof console.error>;

beforeEach(() => {
  mockDbExecute.mockReset();
  logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("isPythonEvaluator", () => {
  test("detects python evaluators by scoring type or code template", () => {
    expect(isPythonEvaluator({ scoring_type: "PYTHON" })).toBe(true);
    expect(isPythonEvaluator({ scoring_type: "python" })).toBe(true);
    expect(
      isPythonEvaluator({ scoring_type: "", code_template: { code: "x" } })
    ).toBe(true);
    expect(
      isPythonEvaluator({ scoring_type: "LLM-BOOLEAN", llm_template: {} })
    ).toBe(false);
    expect(
      isPythonEvaluator({ scoring_type: "LLM-RANGE", last_mile_config: {} })
    ).toBe(false);
  });
});

describe("EvaluatorManager with python evaluators", () => {
  test("runLLMEvaluatorScore returns the unsupported error without logging", async () => {
    const manager = new EvaluatorManager({ organizationId: ORG } as any);
    const result = await manager.runLLMEvaluatorScore({
      evaluator: pythonEvaluatorRow,
      inputRecord: { inputs: {} },
      request_id: "req-1",
      requestBody: {} as any,
      responseBody: {} as any,
      heliconeRequest: {} as any,
    });
    expect(result.error).toBe(PYTHON_EVALUATORS_UNSUPPORTED_MESSAGE);
    expect(mockDbExecute).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test("createEvaluator rejects python evaluators without writing", async () => {
    const manager = new EvaluatorManager({ organizationId: ORG } as any);
    for (const params of [
      { name: "a", scoring_type: "PYTHON", code_template: { code: "x" } },
      { name: "b", scoring_type: "PYTHON" },
      { name: "c", scoring_type: "LLM-BOOLEAN", code_template: { code: "x" } },
    ]) {
      const result = await manager.createEvaluator(params);
      expect(result.error).toBe(PYTHON_EVALUATORS_UNSUPPORTED_MESSAGE);
    }
    expect(mockDbExecute).not.toHaveBeenCalled();
  });

  test("updateEvaluator rejects python params and edits to existing python evaluators", async () => {
    const manager = new EvaluatorManager({ organizationId: ORG } as any);

    const setsCode = await manager.updateEvaluator(pythonEvaluatorRow.id, {
      code_template: { code: "x" },
    });
    expect(setsCode.error).toBe(PYTHON_EVALUATORS_UNSUPPORTED_MESSAGE);
    expect(mockDbExecute).not.toHaveBeenCalled();

    mockDbExecute.mockResolvedValueOnce({
      data: [pythonEvaluatorRow],
      error: null,
    });
    const renamesPython = await manager.updateEvaluator(pythonEvaluatorRow.id, {
      name: "renamed",
      llm_template: { foo: 1 },
    });
    expect(renamesPython.error).toBe(PYTHON_EVALUATORS_UNSUPPORTED_MESSAGE);
    // Only the ownership/type lookup ran; no UPDATE was issued.
    expect(mockDbExecute).toHaveBeenCalledTimes(1);
    expect(mockDbExecute.mock.calls[0][0]).not.toMatch(/UPDATE/);
  });

  test("updateEvaluator still updates non-python evaluators", async () => {
    const manager = new EvaluatorManager({ organizationId: ORG } as any);
    mockDbExecute
      .mockResolvedValueOnce({
        data: [
          {
            scoring_type: "LLM-BOOLEAN",
            code_template: null,
            llm_template: { a: 1 },
            last_mile_config: null,
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: [{ id: "x" }], error: null });
    const result = await manager.updateEvaluator("x", {
      llm_template: { a: 2 },
    });
    expect(result.error).toBeNull();
    expect(mockDbExecute).toHaveBeenCalledTimes(2);
    expect(mockDbExecute.mock.calls[1][0]).toMatch(/UPDATE evaluator/);
  });
});

describe("OnlineEvalHandler with python evaluators", () => {
  function onlineEvalRow(overrides: Record<string, unknown>) {
    return {
      id: "oe",
      evaluator_id: "ev",
      evaluator_name: "ev",
      evaluator_created_at: "2025-01-01",
      config: { sampleRate: 100 },
      last_mile_config: null,
      evaluator_scoring_type: "LLM-BOOLEAN",
      evaluator_llm_template: undefined,
      evaluator_code_template: undefined,
      ...overrides,
    };
  }

  function context(requestId: string) {
    return {
      timingMetrics: [],
      orgParams: { id: ORG },
      authParams: { organizationId: ORG },
      message: { log: { request: { id: requestId } } },
      processedLog: {
        request: { properties: {}, body: {} },
        response: { body: {} },
      },
    } as any;
  }

  test("skips python evaluators silently and still runs the others", async () => {
    mockDbExecute.mockImplementation(async (sql: string) => {
      if (/COUNT\(\*\)/.test(sql)) {
        return { data: [{ count: 2 }], error: null } as any;
      }
      return {
        data: [
          onlineEvalRow({
            id: "oe-py",
            evaluator_id: "ev-py",
            evaluator_name: "python check",
            evaluator_scoring_type: "PYTHON",
            evaluator_code_template: { code: "print(1)" },
          }),
          onlineEvalRow({
            id: "oe-llm",
            evaluator_id: "ev-llm",
            evaluator_name: "llm check",
            evaluator_llm_template: { promptTemplate: "x" },
          }),
        ],
        error: null,
      } as any;
    });
    const runSpy = jest
      .spyOn(EvaluatorManager.prototype, "runLLMEvaluatorScore")
      .mockResolvedValue(ok({ score: true }));

    const handler = new OnlineEvalHandler();
    for (let i = 0; i < 5; i++) {
      const ctx = context(`req-${i}`);
      const result = await handler.handle(ctx);
      expect(result.error).toBeNull();
      expect(ctx.processedLog.request.scores).toEqual({ llm_check: true });
      expect(ctx.processedLog.request.scores_evaluatorIds).toEqual({
        llm_check: "ev-llm",
      });
    }

    // Only the LLM evaluator was dispatched, once per log.
    expect(runSpy).toHaveBeenCalledTimes(5);
    for (const call of runSpy.mock.calls) {
      expect(call[0].evaluator.id).toBe("ev-llm");
    }
    expect(errorSpy).not.toHaveBeenCalled();
    // One line per process for the skipped python evaluator, not one per log.
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(String(logSpy.mock.calls[0][0])).toMatch(
      /python evaluators are no longer supported/
    );
  });
});

describe("EvaluatorController python endpoints", () => {
  test("POST /python/test returns 410 Gone without checking tier or running code", async () => {
    const controller = new EvaluatorController();
    const result = await controller.testPythonEvaluator(req(), {
      code: "print(1)",
      testInput: {
        inputBody: "{}",
        outputBody: "{}",
        inputs: { inputs: {} },
      },
    });
    expect(controller.getStatus()).toBe(410);
    expect(result.error).toBe(PYTHON_EVALUATORS_UNSUPPORTED_MESSAGE);
    expect(result.data).toBeNull();
    expect(mockDbExecute).not.toHaveBeenCalled();
  });

  test("creating a python evaluator returns 400", async () => {
    const controller = new EvaluatorController();
    const result = await controller.createEvaluator(
      { name: "py", scoring_type: "PYTHON", code_template: { code: "x" } },
      req()
    );
    expect(controller.getStatus()).toBe(400);
    expect(result.error).toBe(PYTHON_EVALUATORS_UNSUPPORTED_MESSAGE);
    expect(mockDbExecute).not.toHaveBeenCalled();
  });

  test("updating an existing python evaluator returns 400", async () => {
    mockDbExecute.mockResolvedValueOnce({
      data: [pythonEvaluatorRow],
      error: null,
    });
    const controller = new EvaluatorController();
    const result = await controller.updateEvaluator(
      pythonEvaluatorRow.id,
      { name: "renamed" },
      req()
    );
    expect(controller.getStatus()).toBe(400);
    expect(result.error).toBe(PYTHON_EVALUATORS_UNSUPPORTED_MESSAGE);
  });
});
