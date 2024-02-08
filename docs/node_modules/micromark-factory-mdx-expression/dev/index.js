/**
 * @typedef {import('estree').Program} Program
 * @typedef {import('micromark-util-events-to-acorn').Acorn} Acorn
 * @typedef {import('micromark-util-events-to-acorn').AcornOptions} AcornOptions
 * @typedef {import('micromark-util-types').Effects} Effects
 * @typedef {import('micromark-util-types').Point} Point
 * @typedef {import('micromark-util-types').State} State
 * @typedef {import('micromark-util-types').TokenType} TokenType
 * @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
 */

/**
 * @typedef MdxSignalOk
 *   Good result.
 * @property {'ok'} type
 *   Type.
 * @property {Program | undefined} estree
 *   Value.
 *
 * @typedef MdxSignalNok
 *   Bad result.
 * @property {'nok'} type
 *   Type.
 * @property {VFileMessage} message
 *   Value.
 *
 * @typedef {MdxSignalOk | MdxSignalNok} MdxSignal
 */

import {markdownLineEnding} from 'micromark-util-character'
import {eventsToAcorn} from 'micromark-util-events-to-acorn'
import {codes} from 'micromark-util-symbol/codes.js'
import {types} from 'micromark-util-symbol/types.js'
import {positionFromEstree} from 'unist-util-position-from-estree'
import {ok as assert} from 'uvu/assert'
import {VFileMessage} from 'vfile-message'

/**
 * @this {TokenizeContext}
 *   Context.
 * @param {Effects} effects
 *   Context.
 * @param {State} ok
 *   State switched to when successful
 * @param {TokenType} type
 *   Token type for whole (`{}`).
 * @param {TokenType} markerType
 *   Token type for the markers (`{`, `}`).
 * @param {TokenType} chunkType
 *   Token type for the value (`1`).
 * @param {Acorn | null | undefined} [acorn]
 *   Object with `acorn.parse` and `acorn.parseExpressionAt`.
 * @param {AcornOptions | null | undefined} [acornOptions]
 *   Configuration for acorn.
 * @param {boolean | null | undefined} [addResult=false]
 *   Add `estree` to token.
 * @param {boolean | null | undefined} [spread=false]
 *   Support a spread (`{...a}`) only.
 * @param {boolean | null | undefined} [allowEmpty=false]
 *   Support an empty expression.
 * @param {boolean | null | undefined} [allowLazy=false]
 *   Support lazy continuation of an expression.
 * @returns {State}
 */
// eslint-disable-next-line max-params
export function factoryMdxExpression(
  effects,
  ok,
  type,
  markerType,
  chunkType,
  acorn,
  acornOptions,
  addResult,
  spread,
  allowEmpty,
  allowLazy
) {
  const self = this
  const eventStart = this.events.length + 3 // Add main and marker token
  let size = 0
  /** @type {Point} */
  let pointStart
  /** @type {Error} */
  let lastCrash

  return start

  /**
   * Start of an MDX expression.
   *
   * ```markdown
   * > | a {Math.PI} c
   *       ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    assert(code === codes.leftCurlyBrace, 'expected `{`')
    effects.enter(type)
    effects.enter(markerType)
    effects.consume(code)
    effects.exit(markerType)
    pointStart = self.now()
    return before
  }

  /**
   * Before data.
   *
   * ```markdown
   * > | a {Math.PI} c
   *        ^
   * ```
   *
   * @type {State}
   */
  function before(code) {
    if (code === codes.eof) {
      throw (
        lastCrash ||
        new VFileMessage(
          'Unexpected end of file in expression, expected a corresponding closing brace for `{`',
          self.now(),
          'micromark-extension-mdx-expression:unexpected-eof'
        )
      )
    }

    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return eolAfter
    }

    if (code === codes.rightCurlyBrace && size === 0) {
      /** @type {MdxSignal} */
      const next = acorn
        ? mdxExpressionParse.call(
            self,
            acorn,
            acornOptions,
            eventStart,
            pointStart,
            allowEmpty || false,
            spread || false
          )
        : {type: 'ok', estree: undefined}

      if (next.type === 'ok') {
        effects.enter(markerType)
        effects.consume(code)
        effects.exit(markerType)
        const token = effects.exit(type)

        if (addResult && next.estree) {
          Object.assign(token, {estree: next.estree})
        }

        return ok
      }

      lastCrash = next.message
      effects.enter(chunkType)
      effects.consume(code)
      return inside
    }

    effects.enter(chunkType)
    return inside(code)
  }

  /**
   * In data.
   *
   * ```markdown
   * > | a {Math.PI} c
   *        ^
   * ```
   *
   * @type {State}
   */
  function inside(code) {
    if (
      (code === codes.rightCurlyBrace && size === 0) ||
      code === codes.eof ||
      markdownLineEnding(code)
    ) {
      effects.exit(chunkType)
      return before(code)
    }

    // Don’t count if gnostic.
    if (code === codes.leftCurlyBrace && !acorn) {
      size += 1
    } else if (code === codes.rightCurlyBrace) {
      size -= 1
    }

    effects.consume(code)
    return inside
  }

  /**
   * After eol.
   *
   * ```markdown
   *   | a {b +
   * > | c} d
   *     ^
   * ```
   *
   * @type {State}
   */
  function eolAfter(code) {
    const now = self.now()

    // Lazy continuation in a flow expression (or flow tag) is a syntax error.
    if (
      now.line !== pointStart.line &&
      !allowLazy &&
      self.parser.lazy[now.line]
    ) {
      // `markdown-rs` uses:
      // ``Unexpected lazy line in expression in container, expected line to be prefixed with `>` when in a block quote, whitespace when in a list, etc``.
      throw new VFileMessage(
        'Unexpected end of file in expression, expected a corresponding closing brace for `{`',
        self.now(),
        'micromark-extension-mdx-expression:unexpected-eof'
      )
    }

    // Idea: investigate if we’d need to use more complex stripping.
    // Take this example:
    //
    // ```markdown
    // >  aaa <b c={`
    // >      d
    // >  `} /> eee
    // ```
    //
    // The block quote takes one space from each line, the paragraph doesn’t.
    // The intent above is *perhaps* for the split to be as `>␠␠|␠␠␠␠|d`,
    // Currently, we *don’t* do anything at all, it’s `>␠|␠␠␠␠␠|d` instead.
    //
    // Note: we used to have some handling here, and `markdown-rs` still does,
    // which should be removed.
    return before(code)
  }
}

/**
 * Mix of `markdown-rs`’s `parse_expression` and `MdxExpressionParse`
 * functionality, to wrap our `eventsToAcorn`.
 *
 * In the future, the plan is to realise the rust way, which allows arbitrary
 * parsers.
 *
 * @this {TokenizeContext}
 * @param {Acorn} acorn
 * @param {AcornOptions | null | undefined} acornOptions
 * @param {number} eventStart
 * @param {Point} pointStart
 * @param {boolean} allowEmpty
 * @param {boolean} spread
 * @returns {MdxSignal}
 */
// eslint-disable-next-line max-params
function mdxExpressionParse(
  acorn,
  acornOptions,
  eventStart,
  pointStart,
  allowEmpty,
  spread
) {
  // Gnostic mode: parse w/ acorn.
  const result = eventsToAcorn(this.events.slice(eventStart), {
    acorn,
    acornOptions,
    start: pointStart,
    expression: true,
    allowEmpty,
    prefix: spread ? '({' : '',
    suffix: spread ? '})' : ''
  })
  const estree = result.estree

  // Get the spread value.
  if (spread && estree) {
    // Should always be the case as we wrap in `d={}`
    assert(estree.type === 'Program', 'expected program')
    const head = estree.body[0]
    assert(head, 'expected body')

    // Can occur in some complex attributes.
    /* c8 ignore next 11 */
    if (
      head.type !== 'ExpressionStatement' ||
      head.expression.type !== 'ObjectExpression'
    ) {
      throw new VFileMessage(
        'Unexpected `' +
          head.type +
          '` in code: expected an object spread (`{...spread}`)',
        positionFromEstree(head).start,
        'micromark-extension-mdx-expression:non-spread'
      )
    } else if (head.expression.properties[1]) {
      throw new VFileMessage(
        'Unexpected extra content in spread: only a single spread is supported',
        positionFromEstree(head.expression.properties[1]).start,
        'micromark-extension-mdx-expression:spread-extra'
      )
    } else if (
      head.expression.properties[0] &&
      head.expression.properties[0].type !== 'SpreadElement'
    ) {
      throw new VFileMessage(
        'Unexpected `' +
          head.expression.properties[0].type +
          '` in code: only spread elements are supported',
        positionFromEstree(head.expression.properties[0]).start,
        'micromark-extension-mdx-expression:non-spread'
      )
    }
  }

  if (result.error) {
    return {
      type: 'nok',
      message: new VFileMessage(
        'Could not parse expression with acorn: ' + result.error.message,
        {
          line: result.error.loc.line,
          column: result.error.loc.column + 1,
          offset: result.error.pos
        },
        'micromark-extension-mdx-expression:acorn'
      )
    }
  }

  return {type: 'ok', estree}
}
