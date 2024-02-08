export { createProcessor } from "./lib/core.js";
export { nodeTypes } from "./lib/node-types.js";
export type ProcessorOptions = import('./lib/core.js').ProcessorOptions;
export type CompileOptions = import('./lib/compile.js').CompileOptions;
export type EvaluateOptions = import('./lib/evaluate.js').EvaluateOptions;
export { compile, compileSync } from "./lib/compile.js";
export { evaluate, evaluateSync } from "./lib/evaluate.js";
export { run, runSync } from "./lib/run.js";
