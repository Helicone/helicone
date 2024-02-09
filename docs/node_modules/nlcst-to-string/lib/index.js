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
// To do next major: remove `separator`.
export function toString(value, separator) {
  let index = -1

  if (!value || (!Array.isArray(value) && !value.type)) {
    throw new Error('Expected node, not `' + value + '`')
  }

  // @ts-expect-error Looks like a literal.
  if (typeof value.value === 'string') return value.value

  /** @type {Array<Content|Root>} */
  // @ts-expect-error Looks like a list of nodes or parent.
  const children = (Array.isArray(value) ? value : value.children) || []

  // Shortcut: This is pretty common, and a small performance win.
  if (children.length === 1 && 'value' in children[0]) {
    return children[0].value
  }

  /** @type {Array<string>} */
  const values = []

  while (++index < children.length) {
    values[index] = toString(children[index], separator)
  }

  return values.join(separator || '')
}
