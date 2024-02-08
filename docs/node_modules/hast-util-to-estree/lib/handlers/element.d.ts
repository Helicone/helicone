/**
 * Turn a hast element into an estree node.
 *
 * @param {Element} node
 *   hast node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {JsxElement}
 *   estree expression.
 */
export function element(node: Element, state: State): JsxElement
export type Element = import('hast').Element
export type Property = import('estree').Property
export type JsxElement = import('estree-jsx').JSXElement
export type JsxSpreadAttribute = import('estree-jsx').JSXSpreadAttribute
export type JsxAttribute = import('estree-jsx').JSXAttribute
export type State = import('../state.js').State
export type Style = Record<string, string>
