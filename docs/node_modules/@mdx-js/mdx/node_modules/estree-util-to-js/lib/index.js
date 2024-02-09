/**
 * @typedef {import('estree-jsx').Program} Program
 * @typedef {typeof import('source-map').SourceMapGenerator} SourceMapGenerator
 * @typedef {import('source-map').RawSourceMap} Map
 * @typedef {import('./types.js').Handlers} Handlers
 */

/**
 * @typedef BaseFields
 * @property {Handlers | null | undefined} [handlers]
 *   Object mapping node types to functions handling the corresponding nodes.
 *
 * @typedef SourceMapFieldsWithoutSourceMapGenerator
 * @property {null | undefined} [SourceMapGenerator]
 *   Generate a source map by passing a `SourceMapGenerator` from `source-map`
 *   in.
 *   This works if there is positional info on nodes.
 * @property {null | undefined} [filePath]
 *   Path to input file.
 *   Only used in source map.
 *
 * @typedef SourceMapFieldsWithSourceMapGenerator
 * @property {SourceMapGenerator} SourceMapGenerator
 *   Generate a source map by passing a `SourceMapGenerator` from `source-map`
 *   in.
 *   This works if there is positional info on nodes.
 * @property {string | null | undefined} [filePath]
 *   Path to input file.
 *   Only used in source map.
 *
 * @typedef SourceMapFieldsMaybeSourceMapGenerator
 * @property {SourceMapGenerator | null | undefined} SourceMapGenerator
 *   Generate a source map by passing a `SourceMapGenerator` from `source-map`
 *   in.
 *   This works if there is positional info on nodes.
 * @property {string | null | undefined} [filePath]
 *   Path to input file.
 *   Only used in source map.
 *
 * @typedef {BaseFields & SourceMapFieldsWithoutSourceMapGenerator} OptionsWithoutSourceMapGenerator
 * @typedef {BaseFields & SourceMapFieldsWithSourceMapGenerator} OptionsWithSourceMapGenerator
 * @typedef {BaseFields & SourceMapFieldsMaybeSourceMapGenerator} OptionsWithMaybeMapGenerator
 *
 * @typedef {OptionsWithMaybeMapGenerator} Options
 *   Configuration (optional).
 *
 * @typedef BaseResultFields
 * @property {string} value
 *   Serialized JavaScript.
 *
 * @typedef ResultFieldsWithoutSourceMapGenerator
 * @property {undefined} map
 *   Source map as (parsed) JSON, if `SourceMapGenerator` is passed.
 *
 * @typedef ResultFieldsWithSourceMapGenerator
 * @property {Map} map
 *   Source map as (parsed) JSON, if `SourceMapGenerator` is not passed.
 *
 * @typedef ResultFieldsMaybeSourceMapGenerator
 * @property {Map | undefined} map
 *   Source map as (parsed) JSON, if `SourceMapGenerator` might be passed.
 *
 * @typedef {BaseResultFields & ResultFieldsWithoutSourceMapGenerator} ResultWithoutSourceMapGenerator
 * @typedef {BaseResultFields & ResultFieldsWithSourceMapGenerator} ResultWithSourceMapGenerator
 * @typedef {BaseResultFields & ResultFieldsMaybeSourceMapGenerator} ResultMaybeSourceMapGenerator
 *
 * @typedef {ResultMaybeSourceMapGenerator} Result
 */

// @ts-expect-error: `astring` has broken types.
import * as astring from 'astring'

/** @type {Handlers} */
const GENERATOR = astring.GENERATOR

/** @type {(node: Program, options: unknown) => string} */
const generate = astring.generate

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
export const toJs =
  /**
   * @type {(
   *   ((value: Program, options: OptionsWithSourceMapGenerator) => ResultWithSourceMapGenerator) &
   *   ((value: Program, options: OptionsWithMaybeMapGenerator) => ResultMaybeSourceMapGenerator) &
   *   ((value: Program, options?: OptionsWithoutSourceMapGenerator | null | undefined) => ResultWithoutSourceMapGenerator)
   * )}
   */
  (
    /**
     * @param {Program} tree
     * @param {Options | null | undefined} [options]
     * @returns {Result}
     */
    function (tree, options) {
      const {SourceMapGenerator, filePath, handlers} = options || {}
      const sourceMap = SourceMapGenerator
        ? new SourceMapGenerator({file: filePath || '<unknown>.js'})
        : undefined

      const value = generate(tree, {
        comments: true,
        generator: {...GENERATOR, ...handlers},
        sourceMap
      })
      const map = sourceMap ? sourceMap.toJSON() : undefined

      return {value, map}
    }
  )
