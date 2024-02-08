/**
 * @typedef {import('estree-jsx').Node} Node
 */
/**
 * @param {Node} from
 *   Node to take from.
 * @param {Node} to
 *   Node to add to.
 * @returns {void}
 *   Nothing.
 */
export function create(from: Node, to: Node): void;
export type Node = import('estree-jsx').Node;
