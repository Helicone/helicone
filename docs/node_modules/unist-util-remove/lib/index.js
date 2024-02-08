/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('unist-util-is').Test} Test
 *
 * @typedef Options
 *   Configuration.
 * @property {boolean | null | undefined} [cascade=true]
 *   Whether to drop parent nodes if they had children, but all their children
 *   were filtered out.
 */

import {convert} from 'unist-util-is'

/** @type {Array<unknown>} */
const empty = []

/**
 * Change the given `tree` by removing all nodes that pass `test`.
 *
 * The tree is walked in preorder (NLR), visiting the node itself, then its
 * head, etc.
 *
 * @param tree
 *   Tree to change.
 * @param options
 *   Configuration (optional).
 * @param test
 *   `unist-util-is` compatible test.
 * @returns
 *   The given `tree` without nodes that pass `test`.
 *
 *   `null` is returned if `tree` itself didn’t pass the test or is cascaded
 *   away.
 */
// To do: next major: don’t return `tree`.
export const remove =
  /**
   * @type {(
   *  (<Tree extends Node>(node: Tree, options: Options, test: Test) => Tree | null) &
   *  (<Tree extends Node>(node: Tree, test: Test) => Tree | null)
   * )}
   */
  (
    /**
     * @param {Node} tree
     * @param {Options | null | undefined} [options]
     * @param {Test | null | undefined} [test]
     * @returns {Node | null}
     */
    function (tree, options, test) {
      const is = convert(test || options)
      const cascade =
        !options || options.cascade === undefined || options.cascade === null
          ? true
          : options.cascade

      return preorder(tree)

      /**
       * Check and remove nodes recursively in preorder.
       * For each composite node, modify its children array in-place.
       *
       * @param {Node} node
       * @param {number | null | undefined} [index]
       * @param {Parent | null | undefined} [parent]
       * @returns {Node | null}
       */
      function preorder(node, index, parent) {
        /** @type {Array<Node>} */
        // @ts-expect-error looks like a parent.
        const children = node.children || empty
        let childIndex = -1
        let position = 0

        if (is(node, index, parent)) {
          return null
        }

        if (children.length > 0) {
          // Move all living children to the beginning of the children array.
          while (++childIndex < children.length) {
            // @ts-expect-error looks like a parent.
            if (preorder(children[childIndex], childIndex, node)) {
              children[position++] = children[childIndex]
            }
          }

          // Cascade delete.
          if (cascade && !position) {
            return null
          }

          // Drop other nodes.
          children.length = position
        }

        return node
      }
    }
  )
