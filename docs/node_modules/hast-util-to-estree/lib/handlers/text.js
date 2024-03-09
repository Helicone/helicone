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
export function text(node, state) {
  const value = String(node.value || '')

  if (value) {
    /** @type {Literal} */
    const result = {type: 'Literal', value}
    state.inherit(node, result)
    /** @type {JsxExpressionContainer} */
    const container = {type: 'JSXExpressionContainer', expression: result}
    state.patch(node, container)
    return container
  }
}
