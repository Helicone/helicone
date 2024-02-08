/**
 * @typedef {import('micromark-factory-mdx-expression').Acorn} Acorn
 * @typedef {import('micromark-factory-mdx-expression').AcornOptions} AcornOptions
 * @typedef {import('micromark-util-types').Construct} Construct
 * @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
 * @typedef {import('micromark-util-types').Tokenizer} Tokenizer
 */

import {factoryTag} from './factory-tag.js'

/**
 * Parse JSX (text).
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
export function jsxText(acorn, acornOptions, addResult) {
  return {tokenize: tokenizeJsxText}

  /**
   * MDX JSX (text).
   *
   * ```markdown
   * > | a <b />.
   *       ^^^^^
   * ```
   *
   * @this {TokenizeContext}
   * @type {Tokenizer}
   */
  function tokenizeJsxText(effects, ok, nok) {
    return factoryTag.call(
      this,
      effects,
      ok,
      nok,
      acorn,
      acornOptions,
      addResult,
      true,
      'mdxJsxTextTag',
      'mdxJsxTextTagMarker',
      'mdxJsxTextTagClosingMarker',
      'mdxJsxTextTagSelfClosingMarker',
      'mdxJsxTextTagName',
      'mdxJsxTextTagNamePrimary',
      'mdxJsxTextTagNameMemberMarker',
      'mdxJsxTextTagNameMember',
      'mdxJsxTextTagNamePrefixMarker',
      'mdxJsxTextTagNameLocal',
      'mdxJsxTextTagExpressionAttribute',
      'mdxJsxTextTagExpressionAttributeMarker',
      'mdxJsxTextTagExpressionAttributeValue',
      'mdxJsxTextTagAttribute',
      'mdxJsxTextTagAttributeName',
      'mdxJsxTextTagAttributeNamePrimary',
      'mdxJsxTextTagAttributeNamePrefixMarker',
      'mdxJsxTextTagAttributeNameLocal',
      'mdxJsxTextTagAttributeInitializerMarker',
      'mdxJsxTextTagAttributeValueLiteral',
      'mdxJsxTextTagAttributeValueLiteralMarker',
      'mdxJsxTextTagAttributeValueLiteralValue',
      'mdxJsxTextTagAttributeValueExpression',
      'mdxJsxTextTagAttributeValueExpressionMarker',
      'mdxJsxTextTagAttributeValueExpressionValue'
    )
  }
}
