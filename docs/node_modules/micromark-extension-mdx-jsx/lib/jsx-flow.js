/**
 * @typedef {import('micromark-factory-mdx-expression').Acorn} Acorn
 * @typedef {import('micromark-factory-mdx-expression').AcornOptions} AcornOptions
 * @typedef {import('micromark-util-types').Construct} Construct
 * @typedef {import('micromark-util-types').State} State
 * @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
 * @typedef {import('micromark-util-types').Tokenizer} Tokenizer
 */

import {markdownLineEnding, markdownSpace} from 'micromark-util-character'
import {factorySpace} from 'micromark-factory-space'
import {factoryTag} from './factory-tag.js'

/**
 * Parse JSX (flow).
 *
 * @param {Acorn | undefined} acorn
 *   Acorn parser to use (optional).
 * @param {AcornOptions | undefined} acornOptions
 *   Configuration for acorn.
 * @param {boolean | undefined} addResult
 *   Whether to add `estree` fields to tokens with results from acorn.
 * @returns {Construct}
 *   Construct.
 */
export function jsxFlow(acorn, acornOptions, addResult) {
  return {
    tokenize: tokenizeJsxFlow,
    concrete: true
  }

  /**
   * MDX JSX (flow).
   *
   * ```markdown
   * > | <A />
   *     ^^^^^
   * ```
   *
   * @this {TokenizeContext}
   * @type {Tokenizer}
   */
  function tokenizeJsxFlow(effects, ok, nok) {
    const self = this
    return start

    /**
     * Start of MDX: JSX (flow).
     *
     * ```markdown
     * > | <A />
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
     * After optional whitespace, before of MDX JSX (flow).
     *
     * ```markdown
     * > | <A />
     *     ^
     * ```
     *
     * @type {State}
     */
    function before(code) {
      return factoryTag.call(
        self,
        effects,
        after,
        nok,
        acorn,
        acornOptions,
        addResult,
        false,
        'mdxJsxFlowTag',
        'mdxJsxFlowTagMarker',
        'mdxJsxFlowTagClosingMarker',
        'mdxJsxFlowTagSelfClosingMarker',
        'mdxJsxFlowTagName',
        'mdxJsxFlowTagNamePrimary',
        'mdxJsxFlowTagNameMemberMarker',
        'mdxJsxFlowTagNameMember',
        'mdxJsxFlowTagNamePrefixMarker',
        'mdxJsxFlowTagNameLocal',
        'mdxJsxFlowTagExpressionAttribute',
        'mdxJsxFlowTagExpressionAttributeMarker',
        'mdxJsxFlowTagExpressionAttributeValue',
        'mdxJsxFlowTagAttribute',
        'mdxJsxFlowTagAttributeName',
        'mdxJsxFlowTagAttributeNamePrimary',
        'mdxJsxFlowTagAttributeNamePrefixMarker',
        'mdxJsxFlowTagAttributeNameLocal',
        'mdxJsxFlowTagAttributeInitializerMarker',
        'mdxJsxFlowTagAttributeValueLiteral',
        'mdxJsxFlowTagAttributeValueLiteralMarker',
        'mdxJsxFlowTagAttributeValueLiteralValue',
        'mdxJsxFlowTagAttributeValueExpression',
        'mdxJsxFlowTagAttributeValueExpressionMarker',
        'mdxJsxFlowTagAttributeValueExpressionValue'
      )(code)
    }

    /**
     * After an MDX JSX (flow) tag.
     *
     * ```markdown
     * > | <A>
     *        ^
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
     * After an MDX JSX (flow) tag, after optional whitespace.
     *
     * ```markdown
     * > | <A> <B>
     *         ^
     * ```
     *
     * @type {State}
     */
    function end(code) {
      // Another tag.
      return code === 60
        ? start(code)
        : code === null || markdownLineEnding(code)
        ? ok(code)
        : nok(code)
    }
  }
}
