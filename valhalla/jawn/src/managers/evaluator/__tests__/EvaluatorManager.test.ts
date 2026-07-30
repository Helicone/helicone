import { EvaluatorManager } from "../EvaluatorManager";
import { AuthParams } from "../../../packages/common/auth/types";
import { err, ok } from "../../../packages/common/result";

// pythonEvaluator builds a CodeSandbox pool at import time, which requires a
// sandbox API key. This suite never reaches it.
jest.mock("../pythonEvaluator", () => ({
  pythonEvaluator: jest.fn(),
}));

jest.mock("../../experiment/ExperimentV2Manager", () => ({
  ExperimentV2Manager: jest.fn().mockImplementation(() => ({
    hasAccessToExperiment: async () => true,
    getExperimentOutputForScores: async () => ({
      data: [
        {
          request_id: "request-1",
          input_record: { inputs: { prompt: "hello" }, autoInputs: {} },
          scores: {},
        },
      ],
      error: null,
    }),
  })),
}));

describe("EvaluatorManager.runExperimentEvaluators", () => {
  const authParams: AuthParams = {
    organizationId: "test-org-id",
    userId: "test-user-id",
    role: "admin",
  };

  const evaluator = {
    id: "evaluator-1",
    created_at: "2024-01-01T00:00:00.000Z",
    scoring_type: "LLM-BOOLEAN",
    llm_template: {},
    organization_id: "test-org-id",
    updated_at: "2024-01-01T00:00:00.000Z",
    name: "Quality Gate",
    code_template: null,
    last_mile_config: null,
  };

  // The manager is typed with private members; the test stubs them directly.
  const buildManager = () => new EvaluatorManager(authParams) as any;

  const stubEvaluatorRun = (manager: any, evaluatorResult: unknown) => {
    jest
      .spyOn(manager, "getContent")
      .mockResolvedValue(ok({ requestBody: "{}", responseBody: "{}" }));
    return jest
      .spyOn(manager, "runEvaluatorAndPostScore")
      .mockResolvedValue(evaluatorResult);
  };

  it("returns success when every evaluator succeeds", async () => {
    const manager = buildManager();
    jest
      .spyOn(manager, "getEvaluatorsForExperiment")
      .mockResolvedValue(ok([evaluator]));
    const runEvaluator = stubEvaluatorRun(manager, ok(null));

    const result = await manager.runExperimentEvaluators("experiment-1");

    expect(runEvaluator).toHaveBeenCalledTimes(1);
    expect(result).toEqual(ok(null));
  });

  it("returns the evaluator error instead of reporting success", async () => {
    const manager = buildManager();
    jest
      .spyOn(manager, "getEvaluatorsForExperiment")
      .mockResolvedValue(ok([evaluator]));
    const runEvaluator = stubEvaluatorRun(
      manager,
      err("SyntheticEvaluatorError")
    );

    const result = await manager.runExperimentEvaluators("experiment-1");

    expect(runEvaluator).toHaveBeenCalledTimes(1);
    expect(result).toEqual(err("SyntheticEvaluatorError"));
  });

  it("returns the evaluator list error before running any evaluator", async () => {
    const manager = buildManager();
    jest
      .spyOn(manager, "getEvaluatorsForExperiment")
      .mockResolvedValue(err("Unauthorized"));
    const runEvaluator = stubEvaluatorRun(manager, ok(null));

    const result = await manager.runExperimentEvaluators("experiment-1");

    expect(runEvaluator).not.toHaveBeenCalled();
    expect(result).toEqual(err("Unauthorized"));
  });
});
