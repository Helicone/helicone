/**
 * @typedef {import('estree-jsx').Node} Node
 * @typedef {import('estree-jsx').Declaration} Declaration
 */
/**
 * Check if `node` is a declaration.
 *
 * @param {Node} node
 *   Node to check.
 * @returns {node is Declaration}
 *   Whether `node` is a declaration.
 */
export function isDeclaration(node: Node): node is import("estree").Declaration;
export type Node = import('estree-jsx').Node;
export type Declaration = import('estree-jsx').Declaration;
