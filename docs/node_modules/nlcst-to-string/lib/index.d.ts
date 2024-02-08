/**
 * @typedef {import('nlcst').Content} Content
 * @typedef {import('nlcst').Root} Root
 */
/**
 * Get the text content of a node or list of nodes.
 *
 * Prefers the node’s plain-text fields, otherwise serializes its children, and
 * if the given value is an array, serialize the nodes in it.
 *
 * @param {Root | Content | Array<Content>} value
 *   Node or list of nodes to serialize.
 * @param {string | null | undefined} [separator='']
 *   Separator to use.
 * @returns {string}
 *   Result.
 */
export function toString(
  value: Root | Content | Array<Content>,
  separator?: string | null | undefined
): string
export type Content = import('nlcst').Content
export type Root = import('nlcst').Root
