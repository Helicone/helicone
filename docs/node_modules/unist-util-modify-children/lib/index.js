/**
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('unist').Node} Node
 */

/**
 * @template {Parent} Kind
 *   Node type.
 * @callback Modifier
 *   Callback called for each `child` in `parent` later given to `modify`.
 * @param {Kind['children'][number]} child
 *   Child of `parent`.
 * @param {number} index
 *   Position of `child` in `parent`.
 * @param {Kind} parent
 *   Parent node.
 * @returns {number | void}
 *   Position to move to next (optional).
 */

/**
 * @template {Parent} Kind
 *   Node type.
 * @callback Modify
 *   Modify children of `parent`.
 * @param {Kind} parent
 *   Parent node.
 * @returns {void}
 *   Nothing.
 */

import {arrayIterate} from 'array-iterate'

/**
 * Wrap `modifier` to be called for each child in the nodes later given to
 * `modify`.
 *
 * @template {Parent} Kind
 *   Node type.
 * @param {Modifier<Kind>} modifier
 *   Callback called for each `child` in `parent` later given to `modify`.
 * @returns {Modify<Kind>}
 *   Modify children of `parent`.
 */
export function modifyChildren(modifier) {
  return modify

  /** @type {Modify<Parent>} */
  function modify(parent) {
    if (!parent || !parent.children) {
      throw new Error('Missing children in `parent` for `modifier`')
    }

    arrayIterate(parent.children, iteratee, parent)
  }

  /**
   * Pass the context as the third argument to `modifier`.
   *
   * @this {Kind}
   * @param {Node} node
   * @param {number} index
   * @returns {number | void}
   */
  function iteratee(node, index) {
    return modifier(node, index, this)
  }
}
