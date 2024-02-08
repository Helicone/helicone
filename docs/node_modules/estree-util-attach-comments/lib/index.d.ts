/**
 * Attach semistandard estree comment nodes to the tree.
 *
 * This mutates the given `tree`.
 * It takes `comments`, walks the tree, and adds comments as close as possible
 * to where they originated.
 *
 * Comment nodes are given two boolean fields: `leading` (`true` for
 * `/* a *\/ b`) and `trailing` (`true` for `a /* b *\/`).
 * Both fields are `false` for dangling comments: `[/* a *\/]`.
 * This is what `recast` uses too, and is somewhat similar to Babel, which is
 * not estree but instead uses `leadingComments`, `trailingComments`, and
 * `innerComments` arrays on nodes.
 *
 * The algorithm checks any node: even recent (or future) proposals or
 * nonstandard syntax such as JSX, because it ducktypes to find nodes instead
 * of having a list of visitor keys.
 *
 * The algorithm supports `loc` fields (line/column), `range` fields (offsets),
 * and direct `start` / `end` fields.
 *
 * @template {EstreeNode} Tree
 *   Node type.
 * @param {Tree} tree
 *   Tree to attach to.
 * @param {Array<EstreeComment> | null | undefined} [comments]
 *   List of comments.
 * @returns {Tree}
 *   Given tree.
 */
export function attachComments<Tree extends import('estree').BaseNode>(
  tree: Tree,
  comments?: Array<EstreeComment> | null | undefined
): Tree
export type EstreeNode = import('estree').BaseNode
export type EstreeComment = import('estree').Comment
/**
 * Info passed around.
 */
export type State = {
  /**
   * Comments.
   */
  comments: Array<EstreeComment>
  /**
   * Index of comment.
   */
  index: number
}
export type Fields = {
  leading: boolean
  trailing: boolean
}
