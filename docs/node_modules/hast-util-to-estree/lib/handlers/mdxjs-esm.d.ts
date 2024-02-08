/**
 * Handle an MDX ESM node.
 *
 * @param {MdxjsEsm} node
 *   hast node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {void}
 *   Nothing.
 */
export function mdxjsEsm(node: MdxjsEsm, state: State): void
export type MdxjsEsm = import('mdast-util-mdxjs-esm').MdxjsEsm
export type State = import('../state.js').State
