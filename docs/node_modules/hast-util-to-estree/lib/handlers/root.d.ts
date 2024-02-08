/**
 * Turn a hast root node into an estree node.
 *
 * @param {Root} node
 *   hast node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {JsxFragment}
 *   estree JSX fragment.
 */
export function root(node: Root, state: State): JsxFragment
export type Root = import('hast').Root
export type JsxFragment = import('estree-jsx').JSXFragment
export type JsxChild = JsxFragment['children'][number]
export type State = import('../state.js').State
