/**
 * Create an extension for `mdast-util-from-markdown` to enable MDX JSX.
 *
 * @returns {FromMarkdownExtension}
 *   Extension for `mdast-util-from-markdown` to enable MDX JSX.
 *
 *   When using the syntax extension with `addResult`, nodes will have a
 *   `data.estree` field set to an ESTree `Program` node.
 */
export function mdxJsxFromMarkdown(): FromMarkdownExtension
/**
 * Create an extension for `mdast-util-to-markdown` to enable MDX JSX.
 *
 * This extension configures `mdast-util-to-markdown` with
 * `options.fences: true` and `options.resourceLink: true` too, do not
 * overwrite them!
 *
 * @param {ToMarkdownOptions | null | undefined} [options]
 *   Configuration.
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown` to enable MDX JSX.
 */
export function mdxJsxToMarkdown(
  options?: ToMarkdownOptions | null | undefined
): ToMarkdownExtension
export type Program = import('estree-jsx').Program
export type CompileContext = import('mdast-util-from-markdown').CompileContext
export type FromMarkdownExtension = import('mdast-util-from-markdown').Extension
export type FromMarkdownHandle = import('mdast-util-from-markdown').Handle
export type Token = import('mdast-util-from-markdown').Token
export type OnEnterError = import('mdast-util-from-markdown').OnEnterError
export type OnExitError = import('mdast-util-from-markdown').OnExitError
export type ToMarkdownHandle = import('mdast-util-to-markdown').Handle
export type ToMarkdownExtension = import('mdast-util-to-markdown').Options
export type State = import('mdast-util-to-markdown').State
export type Tracker = import('mdast-util-to-markdown').Tracker
export type MdxJsxAttributeValueExpression =
  import('../index.js').MdxJsxAttributeValueExpression
export type MdxJsxAttribute = import('../index.js').MdxJsxAttribute
export type MdxJsxExpressionAttribute =
  import('../index.js').MdxJsxExpressionAttribute
export type MdxJsxFlowElement = import('../index.js').MdxJsxFlowElement
export type MdxJsxTextElement = import('../index.js').MdxJsxTextElement
/**
 * Single tag.
 */
export type Tag = {
  /**
   *   Name of tag, or `undefined` for fragment.
   *
   *   > 👉 **Note**: `null` is used in the AST for fragments, as it serializes in
   *   > JSON.
   */
  name: string | undefined
  /**
   *   Attributes.
   */
  attributes: Array<MdxJsxAttribute | MdxJsxExpressionAttribute>
  /**
   *   Whether the tag is closing (`</x>`).
   */
  close: boolean
  /**
   *   Whether the tag is self-closing (`<x/>`).
   */
  selfClosing: boolean
  /**
   *   Start point.
   */
  start: Token['start']
  /**
   *   End point.
   */
  end: Token['start']
}
/**
 * Configuration.
 */
export type ToMarkdownOptions = {
  /**
   * Preferred quote to use around attribute values.
   */
  quote?: '"' | "'" | null | undefined
  /**
   * Use the other quote if that results in less bytes.
   */
  quoteSmart?: boolean | null | undefined
  /**
   * Do not use an extra space when closing self-closing elements: `<img/>`
   * instead of `<img />`.
   */
  tightSelfClosing?: boolean | null | undefined
  /**
   * Try and wrap syntax at this width.
   *
   * When set to a finite number (say, `80`), the formatter will print
   * attributes on separate lines when a tag doesn’t fit on one line.
   * The normal behavior is to print attributes with spaces between them
   * instead of line endings.
   */
  printWidth?: number | null | undefined
}
