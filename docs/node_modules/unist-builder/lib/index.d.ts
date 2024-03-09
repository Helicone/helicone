/**
 * @typedef {import('unist').Node} Node
 */
/**
 * @typedef {Array<Node> | string} ChildrenOrValue
 *   List to use as `children` or value to use as `value`.
 *
 * @typedef {Record<string, unknown>} Props
 *   Other fields to add to the node.
 */
/**
 * Build a node.
 *
 * @param type
 *   Node type.
 * @param props
 *   Fields assigned to node.
 * @param value
 *   Children of node or value of `node` (cast to string).
 * @returns
 *   Built node.
 */
export const u: (<T extends string>(
  type: T
) => {
  type: T
}) &
  (<T_1 extends string, P extends Props>(
    type: T_1,
    props: P
  ) => {
    type: T_1
  } & P) &
  (<T_2 extends string>(
    type: T_2,
    value: string
  ) => {
    type: T_2
    value: string
  }) &
  (<T_3 extends string, P_1 extends Props>(
    type: T_3,
    props: P_1,
    value: string
  ) => {
    type: T_3
    value: string
  } & P_1) &
  (<T_4 extends string, C extends import('unist').Node<import('unist').Data>[]>(
    type: T_4,
    children: C
  ) => {
    type: T_4
    children: C
  }) &
  (<
    T_5 extends string,
    P_2 extends Props,
    C_1 extends import('unist').Node<import('unist').Data>[]
  >(
    type: T_5,
    props: P_2,
    children: C_1
  ) => {
    type: T_5
    children: C_1
  } & P_2)
export type Node = import('unist').Node
/**
 * List to use as `children` or value to use as `value`.
 */
export type ChildrenOrValue = Array<Node> | string
/**
 * Other fields to add to the node.
 */
export type Props = Record<string, unknown>
