import { useEvaluators } from "../EvaluatorHook";

type NotUndefined<T> = T extends undefined ? never : T;
type NotNull<T> = T extends null ? never : T;

export type Evaluator = NotNull<
  NotUndefined<
    NotUndefined<ReturnType<typeof useEvaluators>["evaluators"]["data"]>["data"]
  >["data"]
>[number];
