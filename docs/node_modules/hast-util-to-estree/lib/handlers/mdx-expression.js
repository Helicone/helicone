/**
 * @typedef {import('mdast-util-mdx-expression').MdxFlowExpression} MdxFlowExpression
 * @typedef {import('mdast-util-mdx-expression').MdxTextExpression} MdxTextExpression
 * @typedef {import('estree').Expression} Expression
 * @typedef {import('estree-jsx').JSXEmptyExpression} JsxEmptyExpression
 * @typedef {import('estree-jsx').JSXExpressionContainer} JsxExpressionContainer
 * @typedef {import('../state.js').State} State
 */

import {attachComments} from 'estree-util-attach-comments'

/**
 * Turn an MDX expression node into an estree node.
 *
 * @param {MdxFlowExpression | MdxTextExpression} node
 *   hast node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {JsxExpressionContainer}
 *   estree expression.
 */
export function mdxExpression(node, state) {
  const estree = node.data && node.data.estree
  const comments = (estree && estree.comments) || []
  /** @type {Expression | JsxEmptyExpression | undefined} */
  let expression

  if (estree) {
    state.comments.push(...comments)
    attachComments(estree, estree.comments)
    expression =
      (estree.body[0] &&
        estree.body[0].type === 'ExpressionStatement' &&
        estree.body[0].expression) ||
      undefined
  }

  if (!expression) {
    expression = {type: 'JSXEmptyExpression'}
    state.patch(node, expression)
  }

  /** @type {JsxExpressionContainer} */
  const result = {type: 'JSXExpressionContainer', expression}
  state.inherit(node, result)
  return result
}
