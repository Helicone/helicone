import type {Node, Parent} from 'unist'

/**
 * Internal utility to collect all descendants of in `Tree`.
 * @see https://github.com/syntax-tree/unist-util-visit-parents/blob/18d36ad/complex-types.d.ts#L43
 */
export type InclusiveDescendant<
  Tree extends Node = never,
  Found = void
> = Tree extends Parent
  ?
      | Tree
      | InclusiveDescendant<
          Exclude<Tree['children'][number], Found | Tree>,
          Found | Tree
        >
  : Tree

export type MapFunction<Tree extends Node = Node> = (
  node: InclusiveDescendant<Tree>,
  index: number | undefined,
  parent: InclusiveDescendant<Tree> | undefined
) => InclusiveDescendant<Tree>
