/** @type {Refractor} */
export const refractor: Refractor
/**
 * A hidden Prism token
 */
export type _Token = {
  type: string
  content: string
  alias: string
  length: number
}
/**
 * A hidden Prism environment
 */
export type _Env = {
  type: string
  tag: string
  content: Text | RefractorElement | Array<Text | RefractorElement>
  classes: Array<string>
  attributes: Record<string, string>
  language: string
}
export type Root = import('hast').Root
export type Element = import('hast').Element
export type Text = import('hast').Text
export type RefractorElement = Omit<Element, 'children'> & {
  children: Array<RefractorElement | Text>
}
export type RefractorRoot = Omit<Root, 'children'> & {
  children: Array<RefractorElement | Text>
}
export type Languages = import('prismjs').Languages
/**
 * Whatever this is, Prism handles it.
 */
export type Grammar = import('prismjs').Grammar
/**
 * A refractor syntax function
 */
export type Syntax = ((prism: unknown) => void) & {
  displayName: string
  aliases?: Array<string>
}
/**
 * Virtual syntax highlighting
 */
export type Refractor = {
  highlight: typeof highlight
  alias: typeof alias
  register: typeof register
  registered: typeof registered
  listLanguages: typeof listLanguages
  languages: Languages
}
declare function Refractor(): void
/**
 * Highlight `value` (code) as `language` (programming language).
 *
 * @param {string} value
 *   Code to highlight.
 * @param {string|Grammar} language
 *   Programming language name, alias, or grammar.
 * @returns {RefractorRoot}
 *   Node representing highlighted code.
 */
declare function highlight(
  value: string,
  language: string | Grammar
): RefractorRoot
/**
 * Register aliases for already registered languages.
 *
 * @param {Record<string, string|Array<string>>|string} language
 * @param {string|Array<string>} [alias]
 * @returns {void}
 */
declare function alias(
  language: Record<string, string | Array<string>> | string,
  alias?: string | string[] | undefined
): void
/**
 * Register a syntax.
 *
 * @param {Syntax} syntax
 *   Language function made for refractor, as in, the files in
 *   `refractor/lang/*.js`.
 * @returns {void}
 */
declare function register(syntax: Syntax): void
/**
 * Check whether an `alias` or `language` is registered.
 *
 * @param {string} aliasOrLanguage
 * @returns {boolean}
 */
declare function registered(aliasOrLanguage: string): boolean
/**
 * List all registered languages (names and aliases).
 *
 * @returns {Array<string>}
 */
declare function listLanguages(): Array<string>
export {}
