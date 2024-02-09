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
export const mdxExpressionFromMarkdown = {
  enter: {
    mdxFlowExpression: enterMdxFlowExpression,
    mdxTextExpression: enterMdxTextExpression
  },
  exit: {
    mdxFlowExpression: exitMdxExpression,
    mdxFlowExpressionChunk: exitMdxExpressionData,
    mdxTextExpression: exitMdxExpression,
    mdxTextExpressionChunk: exitMdxExpressionData
  }
}

/**
 * Extension for `mdast-util-to-markdown` to enable MDX ESM.
 *
 * @type {ToMarkdownExtension}
 */
export const mdxExpressionToMarkdown = {
  handlers: {
    mdxFlowExpression: handleMdxExpression,
    mdxTextExpression: handleMdxExpression
  },
  unsafe: [
    {character: '{', inConstruct: ['phrasing']},
    {atBreak: true, character: '{'}
  ]
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterMdxFlowExpression(token) {
  this.enter({type: 'mdxFlowExpression', value: ''}, token)
  this.buffer()
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterMdxTextExpression(token) {
  this.enter({type: 'mdxTextExpression', value: ''}, token)
  this.buffer()
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitMdxExpression(token) {
  const value = this.resume()
  /** @type {Program | undefined} */
  // @ts-expect-error: estree.
  const estree = token.estree
  const node = /** @type {MdxFlowExpression | MdxTextExpression} */ (
    this.exit(token)
  )
  node.value = value

  if (estree) {
    node.data = {estree}
  }
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitMdxExpressionData(token) {
  this.config.enter.data.call(this, token)
  this.config.exit.data.call(this, token)
}

/**
 * @type {ToMarkdownHandle}
 * @param {MdxFlowExpression | MdxTextExpression} node
 */
function handleMdxExpression(node) {
  const value = node.value || ''
  return '{' + value + '}'
}
