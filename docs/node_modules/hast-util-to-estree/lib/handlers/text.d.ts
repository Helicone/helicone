/**
 * @typedef {import('hast').Text} Text
 * @typedef {import('estree').Literal} Literal
 * @typedef {import('estree-jsx').JSXExpressionContainer} JsxExpressionContainer
 * @typedef {import('../state.js').State} State
 */
/**
 * Turn a hast text node into an estree node.
 *
 * @param {Text} node
 *   hast node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {JsxExpressionContainer | void}
 *   JSX expression.
 */
export function text(node: Text, state: State): JsxExpressionContainer | void
export type Text = import('hast').Text
export type Literal = import('estree').Literal
export type JsxExpressionContainer = import('estree-jsx').JSXExpressionContainer
export type State = import('../state.js').State
