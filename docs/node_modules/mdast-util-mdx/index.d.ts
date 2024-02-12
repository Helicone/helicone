/**
 * Create an extension for `mdast-util-from-markdown` to enable MDX (ESM, JSX,
 * expressions).
 *
 * @returns {Array<FromMarkdownExtension>}
 *   Extension for `mdast-util-from-markdown` to enable MDX (ESM, JSX,
 *   expressions).
 *
 *   When using the syntax extensions with `addResult`, ESM and expression
 *   nodes will have `data.estree` fields set to ESTree `Program` node.
 */
export function mdxFromMarkdown(): Array<FromMarkdownExtension>
/**
 * Create an extension for `mdast-util-to-markdown` to enable MDX (ESM, JSX,
 * expressions).
 *
 * @param {ToMarkdownOptions | null | undefined} [options]
 *   Configuration.
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown` to enable MDX (ESM, JSX,
 *   expressions).
 */
export function mdxToMarkdown(
  options?: ToMarkdownOptions | null | undefined
): ToMarkdownExtension
export type FromMarkdownExtension = import('mdast-util-from-markdown').Extension
export type ToMarkdownExtension = import('mdast-util-to-markdown').Options
export type MdxFlowExpression =
  import('mdast-util-mdx-expression').MdxFlowExpression
export type MdxTextExpression =
  import('mdast-util-mdx-expression').MdxTextExpression
export type MdxjsEsm = import('mdast-util-mdxjs-esm').MdxjsEsm
export type MdxJsxAttributeValueExpression =
  import('mdast-util-mdx-jsx').MdxJsxAttributeValueExpression
export type MdxJsxAttribute = import('mdast-util-mdx-jsx').MdxJsxAttribute
export type MdxJsxExpressionAttribute =
  import('mdast-util-mdx-jsx').MdxJsxExpressionAttribute
export type MdxJsxFlowElement = import('mdast-util-mdx-jsx').MdxJsxFlowElement
export type MdxJsxTextElement = import('mdast-util-mdx-jsx').MdxJsxTextElement
export type ToMarkdownOptions = import('mdast-util-mdx-jsx').ToMarkdownOptions
