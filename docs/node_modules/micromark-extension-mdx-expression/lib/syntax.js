/**
 * @typedef {import('micromark-util-events-to-acorn').Acorn} Acorn
 * @typedef {import('micromark-util-events-to-acorn').AcornOptions} AcornOptions
 * @typedef {import('micromark-util-types').Extension} Extension
 * @typedef {import('micromark-util-types').State} State
 * @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
 * @typedef {import('micromark-util-types').Tokenizer} Tokenizer
 */

/**
 * @typedef Options
 *   Configuration (optional).
 * @property {Acorn | null | undefined} [acorn]
 *   Acorn parser to use (optional).
 * @property {AcornOptions | null | undefined} [acornOptions]
 *   Configuration for acorn (default: `{ecmaVersion: 2020, locations: true,
 *   sourceType: 'module'}`).
 *
 *   All fields except `locations` can be set.
 * @property {boolean | null | undefined} [addResult=false]
 *   Whether to add `estree` fields to tokens with results from acorn.
 * @property {boolean | null | undefined} [spread=false]
 *   Undocumented option to parse only a spread (used by
 *   `micromark-extension-mdx-jsx` to parse spread attributes).
 * @property {boolean | null | undefined} [allowEmpty=true]
 *   Undocumented option to disallow empty attributes (used by
 *   `micromark-extension-mdx-jsx` to prohobit empty attribute values).
 */

import {factoryMdxExpression} from 'micromark-factory-mdx-expression'
import {factorySpace} from 'micromark-factory-space'
import {markdownLineEnding, markdownSpace} from 'micromark-util-character'
/**
 * Create an extension for `micromark` to enable MDX expression syntax.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {Extension}
 *   Extension for `micromark` that can be passed in `extensions` to enable MDX
 *   expression syntax.
 */
export function mdxExpression(options) {
  const options_ = options || {}
  const addResult = options_.addResult
  const acorn = options_.acorn
  // Hidden: `micromark-extension-mdx-jsx` supports expressions in tags,
  // and one of them is only “spread” elements.
  // It also has expressions that are not allowed to be empty (`<x y={}/>`).
  // Instead of duplicating code there, this are two small hidden feature here
  // to test that behavior.
  const spread = options_.spread
  let allowEmpty = options_.allowEmpty
  /** @type {AcornOptions} */
  let acornOptions
  if (allowEmpty === null || allowEmpty === undefined) {
    allowEmpty = true
  }
  if (acorn) {
    if (!acorn.parseExpressionAt) {
      throw new Error(
        'Expected a proper `acorn` instance passed in as `options.acorn`'
      )
    }
    acornOptions = Object.assign(
      {
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      options_.acornOptions
    )
  } else if (options_.acornOptions || options_.addResult) {
    throw new Error('Expected an `acorn` instance passed in as `options.acorn`')
  }
  return {
    flow: {
      [123]: {
        tokenize: tokenizeFlowExpression,
        concrete: true
      }
    },
    text: {
      [123]: {
        tokenize: tokenizeTextExpression
      }
    }
  }

  /**
   * MDX expression (flow).
   *
   * ```markdown
   * > | {Math.PI}
   *     ^^^^^^^^^
   * ```
   *
   * @this {TokenizeContext}
   * @type {Tokenizer}
   */
  function tokenizeFlowExpression(effects, ok, nok) {
    const self = this
    return start

    /**
     * Start of an MDX expression (flow).
     *
     * ```markdown
     * > | {Math.PI}
     *     ^
     * ```
     *
     * @type {State}
     */
    function start(code) {
      // To do: in `markdown-rs`, constructs need to parse the indent themselves.
      // This should also be introduced in `micromark-js`.

      return before(code)
    }

    /**
     * After optional whitespace, before expression.
     *
     * ```markdown
     * > | {Math.PI}
     *     ^
     * ```
     *
     * @type {State}
     */
    function before(code) {
      return factoryMdxExpression.call(
        self,
        effects,
        after,
        'mdxFlowExpression',
        'mdxFlowExpressionMarker',
        'mdxFlowExpressionChunk',
        acorn,
        acornOptions,
        addResult,
        spread,
        allowEmpty
      )(code)
    }

    /**
     * After expression.
     *
     * ```markdown
     * > | {Math.PI}
     *              ^
     * ```
     *
     * @type {State}
     */
    function after(code) {
      return markdownSpace(code)
        ? factorySpace(effects, end, 'whitespace')(code)
        : end(code)
    }

    /**
     * After expression, after optional whitespace.
     *
     * ```markdown
     * > | {Math.PI}␠␊
     *               ^
     * ```
     *
     * @type {State}
     */
    function end(code) {
      return code === null || markdownLineEnding(code) ? ok(code) : nok(code)
    }
  }

  /**
   * MDX expression (text).
   *
   * ```markdown
   * > | a {Math.PI} c.
   *       ^^^^^^^^^
   * ```
   *
   * @this {TokenizeContext}
   * @type {Tokenizer}
   */
  function tokenizeTextExpression(effects, ok) {
    const self = this
    return start

    /**
     * Start of an MDX expression (text).
     *
     * ```markdown
     * > | a {Math.PI} c.
     *       ^
     * ```
     *
     *
     * @type {State}
     */
    function start(code) {
      return factoryMdxExpression.call(
        self,
        effects,
        ok,
        'mdxTextExpression',
        'mdxTextExpressionMarker',
        'mdxTextExpressionChunk',
        acorn,
        acornOptions,
        addResult,
        spread,
        allowEmpty,
        true
      )(code)
    }
  }
}
