export namespace Prism {
  export namespace util {
    function type(o: any): string
    function objId(obj: Object): number
    function clone<T>(o: T, visited?: Record<number, any> | undefined): T
  }
  export namespace languages {
    export {plainTextGrammar as plain}
    export {plainTextGrammar as plaintext}
    export {plainTextGrammar as text}
    export {plainTextGrammar as txt}
    export function extend(
      id: string,
      redef: {
        [x: string]: RegExp | GrammarToken | (RegExp | GrammarToken)[]
      }
    ): {
      [x: string]: RegExp | GrammarToken | (RegExp | GrammarToken)[]
    }
    export function insertBefore(
      inside: string,
      before: string,
      insert: {
        [x: string]: RegExp | GrammarToken | (RegExp | GrammarToken)[]
      },
      root?:
        | {
            [x: string]: any
          }
        | undefined
    ): {
      [x: string]: RegExp | GrammarToken | (RegExp | GrammarToken)[]
    }
    export function DFS(o: any, callback: any, type: any, visited: any): void
  }
  export const plugins: {}
  export function highlight(
    text: string,
    grammar: {
      [x: string]: RegExp | GrammarToken | (RegExp | GrammarToken)[]
    },
    language: string
  ): string
  export function tokenize(
    text: string,
    grammar: {
      [x: string]: RegExp | GrammarToken | (RegExp | GrammarToken)[]
    }
  ): TokenStream
  export namespace hooks {
    const all: {}
    function add(name: string, callback: HookCallback): void
    function run(
      name: string,
      env: {
        [x: string]: any
      }
    ): void
  }
  export {Token}
}
/**
 * A token stream is an array of strings and {@link Token Token} objects.
 *
 * Token streams have to fulfill a few properties that are assumed by most functions (mostly internal ones) that process
 * them.
 *
 * 1. No adjacent strings.
 * 2. No empty strings.
 *
 *    The only exception here is the token stream that only contains the empty string and nothing else.
 */
export type TokenStream = Array<string | Token>
export type RematchOptions = {
  cause: string
  reach: number
}
export type LinkedListNode<T> = {
  value: T
  /**
   * The previous node.
   */
  prev: LinkedListNode<T> | null
  /**
   * The next node.
   */
  next: LinkedListNode<T> | null
}
/**
 * The expansion of a simple `RegExp` literal to support additional properties.
 */
export type GrammarToken = {
  /**
   * The regular expression of the token.
   */
  pattern: RegExp
  /**
   * If `true`, then the first capturing group of `pattern` will (effectively)
   * behave as a lookbehind group meaning that the captured text will not be part of the matched text of the new token.
   */
  lookbehind?: boolean | undefined
  /**
   * Whether the token is greedy.
   */
  greedy?: boolean | undefined
  /**
   * An optional alias or list of aliases.
   */
  alias?: string | string[] | undefined
  /**
   * The nested grammar of this token.
   *
   * The `inside` grammar will be used to tokenize the text value of each token of this kind.
   *
   * This can be used to make nested and even recursive language definitions.
   *
   * Note: This can cause infinite recursion. Be careful when you embed different languages or even the same language into
   * each another.
   */
  inside?:
    | {
        [x: string]: RegExp | GrammarToken | (RegExp | GrammarToken)[]
      }
    | undefined
}
export type Grammar = {
  [x: string]: RegExp | GrammarToken | Array<RegExp | GrammarToken>
}
/**
 * A function which will invoked after an element was successfully highlighted.
 */
export type HighlightCallback = (element: Element) => void
export type HookCallback = (env: {[x: string]: any}) => void
declare var plainTextGrammar: {}
/**
 * Creates a new token.
 *
 * @param {string} type See {@link Token#type type}
 * @param {string | TokenStream} content See {@link Token#content content}
 * @param {string|string[]} [alias] The alias(es) of the token.
 * @param {string} [matchedStr=""] A copy of the full string this token was created from.
 * @class
 * @global
 * @public
 */
declare function Token(
  type: string,
  content: string | TokenStream,
  alias?: string | string[] | undefined,
  matchedStr?: string | undefined
): void
declare class Token {
  /**
   * Creates a new token.
   *
   * @param {string} type See {@link Token#type type}
   * @param {string | TokenStream} content See {@link Token#content content}
   * @param {string|string[]} [alias] The alias(es) of the token.
   * @param {string} [matchedStr=""] A copy of the full string this token was created from.
   * @class
   * @global
   * @public
   */
  constructor(
    type: string,
    content: string | TokenStream,
    alias?: string | string[] | undefined,
    matchedStr?: string | undefined
  )
  /**
   * The type of the token.
   *
   * This is usually the key of a pattern in a {@link Grammar}.
   *
   * @type {string}
   * @see GrammarToken
   * @public
   */
  public type: string
  /**
   * The strings or tokens contained by this token.
   *
   * This will be a token stream if the pattern matched also defined an `inside` grammar.
   *
   * @type {string | TokenStream}
   * @public
   */
  public content: string | TokenStream
  /**
   * The alias(es) of the token.
   *
   * @type {string|string[]}
   * @see GrammarToken
   * @public
   */
  public alias: string | string[]
  length: number
}
export {}
