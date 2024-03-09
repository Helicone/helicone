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
export function factoryMdxExpression(
  this: import('micromark-util-types').TokenizeContext,
  effects: Effects,
  ok: State,
  type: TokenType,
  markerType: TokenType,
  chunkType: TokenType,
  acorn?: Acorn | null | undefined,
  acornOptions?: AcornOptions | null | undefined,
  addResult?: boolean | null | undefined,
  spread?: boolean | null | undefined,
  allowEmpty?: boolean | null | undefined,
  allowLazy?: boolean | null | undefined
): State
export type Program = import('estree').Program
export type Acorn = import('micromark-util-events-to-acorn').Acorn
export type AcornOptions = import('micromark-util-events-to-acorn').AcornOptions
export type Effects = import('micromark-util-types').Effects
export type Point = import('micromark-util-types').Point
export type State = import('micromark-util-types').State
export type TokenType = import('micromark-util-types').TokenType
export type TokenizeContext = import('micromark-util-types').TokenizeContext
/**
 * Good result.
 */
export type MdxSignalOk = {
  /**
   *   Type.
   */
  type: 'ok'
  /**
   *   Value.
   */
  estree: Program | undefined
}
/**
 * Bad result.
 */
export type MdxSignalNok = {
  /**
   *   Type.
   */
  type: 'nok'
  /**
   *   Value.
   */
  message: VFileMessage
}
export type MdxSignal = MdxSignalOk | MdxSignalNok
import {VFileMessage} from 'vfile-message'
