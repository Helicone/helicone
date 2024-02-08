/**
 * Serialize an estree as JavaScript.
 *
 * @param tree
 *   Estree (esast).
 * @param options
 *   Configuration (optional).
 * @returns
 *   Result, optionally with source map.
 */
export const toJs: ((
  value: Program,
  options: OptionsWithSourceMapGenerator
) => ResultWithSourceMapGenerator) &
  ((
    value: Program,
    options: OptionsWithMaybeMapGenerator
  ) => ResultMaybeSourceMapGenerator) &
  ((
    value: Program,
    options?: OptionsWithoutSourceMapGenerator | null | undefined
  ) => ResultWithoutSourceMapGenerator)
export type Program = import('estree-jsx').Program
export type SourceMapGenerator = typeof import('source-map').SourceMapGenerator
export type Map = import('source-map').RawSourceMap
export type Handlers = import('./types.js').Handlers
export type BaseFields = {
  /**
   * Object mapping node types to functions handling the corresponding nodes.
   */
  handlers?: Handlers | null | undefined
}
export type SourceMapFieldsWithoutSourceMapGenerator = {
  /**
   * Generate a source map by passing a `SourceMapGenerator` from `source-map`
   * in.
   * This works if there is positional info on nodes.
   */
  SourceMapGenerator?: null | undefined
  /**
   * Path to input file.
   * Only used in source map.
   */
  filePath?: null | undefined
}
export type SourceMapFieldsWithSourceMapGenerator = {
  /**
   * Generate a source map by passing a `SourceMapGenerator` from `source-map`
   * in.
   * This works if there is positional info on nodes.
   */
  SourceMapGenerator: SourceMapGenerator
  /**
   * Path to input file.
   * Only used in source map.
   */
  filePath?: string | null | undefined
}
export type SourceMapFieldsMaybeSourceMapGenerator = {
  /**
   * Generate a source map by passing a `SourceMapGenerator` from `source-map`
   * in.
   * This works if there is positional info on nodes.
   */
  SourceMapGenerator: SourceMapGenerator | null | undefined
  /**
   * Path to input file.
   * Only used in source map.
   */
  filePath?: string | null | undefined
}
export type OptionsWithoutSourceMapGenerator = BaseFields &
  SourceMapFieldsWithoutSourceMapGenerator
export type OptionsWithSourceMapGenerator = BaseFields &
  SourceMapFieldsWithSourceMapGenerator
export type OptionsWithMaybeMapGenerator = BaseFields &
  SourceMapFieldsMaybeSourceMapGenerator
/**
 * Configuration (optional).
 */
export type Options = OptionsWithMaybeMapGenerator
export type BaseResultFields = {
  /**
   * Serialized JavaScript.
   */
  value: string
}
export type ResultFieldsWithoutSourceMapGenerator = {
  /**
   * Source map as (parsed) JSON, if `SourceMapGenerator` is passed.
   */
  map: undefined
}
export type ResultFieldsWithSourceMapGenerator = {
  /**
   * Source map as (parsed) JSON, if `SourceMapGenerator` is not passed.
   */
  map: Map
}
export type ResultFieldsMaybeSourceMapGenerator = {
  /**
   * Source map as (parsed) JSON, if `SourceMapGenerator` might be passed.
   */
  map: Map | undefined
}
export type ResultWithoutSourceMapGenerator = BaseResultFields &
  ResultFieldsWithoutSourceMapGenerator
export type ResultWithSourceMapGenerator = BaseResultFields &
  ResultFieldsWithSourceMapGenerator
export type ResultMaybeSourceMapGenerator = BaseResultFields &
  ResultFieldsMaybeSourceMapGenerator
export type Result = ResultMaybeSourceMapGenerator
