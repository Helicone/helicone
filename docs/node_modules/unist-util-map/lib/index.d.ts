/**
 * @typedef {import('unist').Node} Node
 */
/**
 * @template {Node} [Kind=Node]
 *   Node type.
 * @typedef {import('./complex-types.js').MapFunction<Kind>} MapFunction
 *   Function called with a node, its index, and its parent to produce a new
 *   node.
 */
/**
 * Create a new tree by mapping all nodes with the given function.
 *
 * @template {Node} Kind
 *   Type of input tree.
 * @param {Kind} tree
 *   Tree to map.
 * @param {MapFunction<Kind>} mapFunction
 *   Function called with a node, its index, and its parent to produce a new
 *   node.
 * @returns {Kind}
 *   New mapped tree.
 */
export function map<Kind extends import('unist').Node<import('unist').Data>>(
  tree: Kind,
  mapFunction: import('./complex-types.js').MapFunction<Kind>
): Kind
export type Node = import('unist').Node
/**
 * Function called with a node, its index, and its parent to produce a new
 * node.
 */
export type MapFunction<
  Kind extends import('unist').Node<
    import('unist').Data
  > = import('unist').Node<import('unist').Data>
> = import('./complex-types.js').MapFunction<Kind>
