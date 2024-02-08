/**
 * Evaluate MDX.
 *
 * @param {VFileCompatible} vfileCompatible
 *   MDX document to parse (`string`, `Buffer`, `vfile`, anything that can be
 *   given to `vfile`).
 * @param {EvaluateOptions} evaluateOptions
 *   Configuration for evaluation.
 * @return {Promise<ExportMap>}
 *   Export map.
 */
export function evaluate(vfileCompatible: VFileCompatible, evaluateOptions: EvaluateOptions): Promise<ExportMap>;
/**
 * Synchronously evaluate MDX.
 *
 * @param {VFileCompatible} vfileCompatible
 *   MDX document to parse (`string`, `Buffer`, `vfile`, anything that can be
 *   given to `vfile`).
 * @param {EvaluateOptions} evaluateOptions
 *   Configuration for evaluation.
 * @return {ExportMap}
 *   Export map.
 */
export function evaluateSync(vfileCompatible: VFileCompatible, evaluateOptions: EvaluateOptions): ExportMap;
export type ExportMap = import('mdx/types.js').MDXModule;
export type VFileCompatible = import('vfile').VFileCompatible;
export type EvaluateOptions = import('./util/resolve-evaluate-options.js').EvaluateOptions;
