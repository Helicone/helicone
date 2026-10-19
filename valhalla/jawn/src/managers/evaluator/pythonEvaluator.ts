/**
 * Python evaluators used to run user code in CodeSandbox sandboxes. The
 * feature has been retired: nothing here creates a sandbox or loads the
 * CodeSandbox SDK. Existing python evaluator rows stay in the database but
 * never run.
 */
export const PYTHON_EVALUATORS_UNSUPPORTED_MESSAGE =
  "Python evaluators are no longer supported";

export const PYTHON_SCORING_TYPE = "PYTHON";

/**
 * True when an evaluator is a python evaluator: scoring type PYTHON, or a
 * code template with no LLM template or LastMile config (the same dispatch
 * order EvaluatorManager.runLLMEvaluatorScore uses).
 */
export function isPythonEvaluator(evaluator: {
  scoring_type?: string | null;
  code_template?: unknown;
  llm_template?: unknown;
  last_mile_config?: unknown;
}): boolean {
  if (
    typeof evaluator.scoring_type === "string" &&
    evaluator.scoring_type.toUpperCase() === PYTHON_SCORING_TYPE
  ) {
    return true;
  }
  return (
    !evaluator.last_mile_config &&
    !evaluator.llm_template &&
    evaluator.code_template !== undefined &&
    evaluator.code_template !== null
  );
}

/**
 * True when create/update params would make an evaluator a python evaluator.
 * Setting code_template to null (clearing it) is allowed.
 */
export function paramsSetPythonEvaluator(params: {
  scoring_type?: string | null;
  code_template?: unknown;
}): boolean {
  if (
    typeof params.scoring_type === "string" &&
    params.scoring_type.toUpperCase() === PYTHON_SCORING_TYPE
  ) {
    return true;
  }
  return params.code_template !== undefined && params.code_template !== null;
}
