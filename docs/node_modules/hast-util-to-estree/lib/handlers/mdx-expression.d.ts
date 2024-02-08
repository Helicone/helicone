/**
 * Turn an MDX expression node into an estree node.
 *
 * @param {MdxFlowExpression | MdxTextExpression} node
 *   hast node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {JsxExpressionContainer}
 *   estree expression.
 */
export function mdxExpression(
  node: MdxFlowExpression | MdxTextExpression,
  state: State
): JsxExpressionContainer
export type MdxFlowExpression =
  import('mdast-util-mdx-expression').MdxFlowExpression
export type MdxTextExpression =
  import('mdast-util-mdx-expression').MdxTextExpression
export type Expression = import('estree').Expression
export type JsxEmptyExpression = import('estree-jsx').JSXEmptyExpression
export type JsxExpressionContainer = import('estree-jsx').JSXExpressionContainer
export type State = import('../state.js').State
