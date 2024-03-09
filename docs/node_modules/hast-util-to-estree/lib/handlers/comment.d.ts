/**
 * @typedef {import('estree').Comment} Comment
 * @typedef {import('estree-jsx').JSXExpressionContainer} JsxExpressionContainer
 * @typedef {import('estree-jsx').JSXEmptyExpression} JsxEmptyExpression
 * @typedef {import('../state.js').State} State
 */
/**
 * Turn a hast comment into an estree node.
 *
 * @param {import('hast').Comment} node
 *   hast node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {JsxExpressionContainer}
 *   estree expression.
 */
export function comment(
  node: import('hast').Comment,
  state: State
): JsxExpressionContainer
export type Comment = import('estree').Comment
export type JsxExpressionContainer = import('estree-jsx').JSXExpressionContainer
export type JsxEmptyExpression = import('estree-jsx').JSXEmptyExpression
export type State = import('../state.js').State
