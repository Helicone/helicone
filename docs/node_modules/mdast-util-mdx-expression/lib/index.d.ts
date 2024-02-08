/**
 * @typedef {import('estree-jsx').Program} Program
 *
 * @typedef {import('mdast-util-from-markdown').CompileContext} CompileContext
 * @typedef {import('mdast-util-from-markdown').Extension} FromMarkdownExtension
 * @typedef {import('mdast-util-from-markdown').Handle} FromMarkdownHandle
 *
 * @typedef {import('mdast-util-to-markdown').Options} ToMarkdownExtension
 * @typedef {import('mdast-util-to-markdown').Handle} ToMarkdownHandle
 *
 * @typedef {import('../index.js').MdxFlowExpression} MdxFlowExpression
 * @typedef {import('../index.js').MdxTextExpression} MdxTextExpression
 */
/**
 * Extension for `mdast-util-from-markdown` to enable MDX expressions.
 *
 * When using the syntax extension with `addResult`, nodes will have a
 * `data.estree` field set to an ESTree `Program` node.
 *
 * @type {FromMarkdownExtension}
 */
export const mdxExpressionFromMarkdown: FromMarkdownExtension
/**
 * Extension for `mdast-util-to-markdown` to enable MDX ESM.
 *
 * @type {ToMarkdownExtension}
 */
export const mdxExpressionToMarkdown: ToMarkdownExtension
export type Program = import('estree-jsx').Program
export type CompileContext = import('mdast-util-from-markdown').CompileContext
export type FromMarkdownExtension = import('mdast-util-from-markdown').Extension
export type FromMarkdownHandle = import('mdast-util-from-markdown').Handle
export type ToMarkdownExtension = import('mdast-util-to-markdown').Options
export type ToMarkdownHandle = import('mdast-util-to-markdown').Handle
export type MdxFlowExpression = import('../index.js').MdxFlowExpression
export type MdxTextExpression = import('../index.js').MdxTextExpression
