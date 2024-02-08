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
export const remove: (<Tree extends import('unist').Node<import('unist').Data>>(
  node: Tree,
  options: Options,
  test: Test
) => Tree | null) &
  (<Tree_1 extends import('unist').Node<import('unist').Data>>(
    node: Tree_1,
    test: Test
  ) => Tree_1 | null)
export type Node = import('unist').Node
export type Parent = import('unist').Parent
export type Test = import('unist-util-is').Test
/**
 * Configuration.
 */
export type Options = {
  /**
   * Whether to drop parent nodes if they had children, but all their children
   * were filtered out.
   */
  cascade?: boolean | null | undefined
}
