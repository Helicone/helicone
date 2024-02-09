/**
 * @typedef {import('mdast-util-from-markdown').CompileContext} CompileContext
 * @typedef {import('mdast-util-from-markdown').Extension} FromMarkdownExtension
 * @typedef {import('mdast-util-from-markdown').Handle} FromMarkdownHandle
 *
 * @typedef {import('mdast-util-to-markdown').Handle} ToMarkdownHandle
 * @typedef {import('mdast-util-to-markdown').Options} ToMarkdownExtension
 *
 * @typedef {import('estree-jsx').Program} Program
 *
 * @typedef {import('../index.js').MdxjsEsm} MdxjsEsm
 */

// To do: next major: expose functions.

/**
 * Extension for `mdast-util-from-markdown` to enable MDX ESM.
 *
 * When using the syntax extension with `addResult`, nodes will have a
 * `data.estree` field set to an ESTree `Program` node.
 *
 * @type {FromMarkdownExtension}
 */
export const mdxjsEsmFromMarkdown = {
  enter: {mdxjsEsm: enterMdxjsEsm},
  exit: {mdxjsEsm: exitMdxjsEsm, mdxjsEsmData: exitMdxjsEsmData}
}

/**
 * Extension for `mdast-util-to-markdown` to enable MDX ESM.
 *
 * @type {ToMarkdownExtension}
 */
export const mdxjsEsmToMarkdown = {handlers: {mdxjsEsm: handleMdxjsEsm}}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterMdxjsEsm(token) {
  this.enter({type: 'mdxjsEsm', value: ''}, token)
  this.buffer() // Capture EOLs
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitMdxjsEsm(token) {
  const value = this.resume()
  const node = /** @type {MdxjsEsm} */ (this.exit(token))
  /** @type {Program | undefined} */
  // @ts-expect-error: custom.
  const estree = token.estree

  node.value = value

  if (estree) {
    node.data = {estree}
  }
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitMdxjsEsmData(token) {
  this.config.enter.data.call(this, token)
  this.config.exit.data.call(this, token)
}

/**
 * @type {ToMarkdownHandle}
 * @param {MdxjsEsm} node
 */
function handleMdxjsEsm(node) {
  return node.value || ''
}
