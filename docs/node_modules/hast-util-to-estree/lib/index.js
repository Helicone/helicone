/**
 * @typedef {import('hast').Content} Content
 * @typedef {import('hast').Root} Root
 *
 * @typedef {import('estree').ExpressionStatement} ExpressionStatement
 * @typedef {import('estree').Program} Program
 *
 * @typedef {import('mdast-util-mdx-jsx').MdxJsxAttribute} MdxJsxAttribute
 * @typedef {import('mdast-util-mdx-jsx').MdxJsxAttributeValueExpression} MdxJsxAttributeValueExpression
 * @typedef {import('mdast-util-mdx-jsx').MdxJsxExpressionAttribute} MdxJsxExpressionAttribute
 * @typedef {import('mdast-util-mdx-jsx').MdxJsxFlowElement} MdxJsxFlowElement
 * @typedef {import('mdast-util-mdx-jsx').MdxJsxTextElement} MdxJsxTextElement
 *
 * @typedef {import('mdast-util-mdx-expression').MdxFlowExpression} MdxFlowExpression
 * @typedef {import('mdast-util-mdx-expression').MdxTextExpression} MdxTextExpression
 *
 * @typedef {import('./state.js').Options} Options
 */

/**
 * @typedef {Root | Content | MdxJsxAttributeValueExpression | MdxJsxAttribute | MdxJsxExpressionAttribute | MdxJsxFlowElement | MdxJsxTextElement | MdxFlowExpression | MdxTextExpression} Node
 */

import {createState} from './state.js'

/**
 * Transform a hast tree (with embedded MDX nodes) into an estree.
 *
 * ##### Notes
 *
 * ###### Comments
 *
 * Comments are attached to the tree in their neighbouring nodes (`recast`,
 * `babel` style) and also added as a `comments` array on the program node
 * (`espree` style).
 * You may have to do `program.comments = undefined` for certain compilers.
 *
 * ###### Frameworks
 *
 * There are differences between what JSX frameworks accept, such as whether they
 * accept `class` or `className`, or `background-color` or `backgroundColor`.
 *
 * For JSX components written in MDX, the author has to be aware of this
 * difference and write code accordingly.
 * For hast elements transformed by this project, this will be handled through
 * options.
 *
 * | Framework | `elementAttributeNameCase` | `stylePropertyNameCase` |
 * | --------- | -------------------------- | ----------------------- |
 * | Preact    | `'html'`                   | `'dom'`                 |
 * | React     | `'react'`                  | `'dom'`                 |
 * | Solid     | `'html'`                   | `'css'`                 |
 * | Vue       | `'html'`                   | `'dom'`                 |
 *
 * @param {Node} tree
 *   hast tree.
 * @param {Options | null | undefined} [options]
 *   Configuration.
 * @returns {Program}
 *   estree program node.
 *
 *   The program’s last child in `body` is most likely an `ExpressionStatement`,
 *   whose expression is a `JSXFragment` or a `JSXElement`.
 *
 *   Typically, there is only one node in `body`, however, this utility also
 *   supports embedded MDX nodes in the HTML (when `mdast-util-mdx` is used
 *   with mdast to parse markdown before passing its nodes through to hast).
 *   When MDX ESM import/exports are used, those nodes are added before the
 *   fragment or element in body.
 *
 *   There aren’t many great estree serializers out there that support JSX.
 *   To do that, you can use `estree-util-to-js`.
 *   Or, use `estree-util-build-jsx` to turn JSX into function calls, and then
 *   serialize with whatever (`astring`, `escodegen`).
 */
export function toEstree(tree, options) {
  const state = createState(options || {})
  let result = state.handle(tree)
  const body = state.esm

  if (result) {
    if (result.type !== 'JSXFragment' && result.type !== 'JSXElement') {
      result = {
        type: 'JSXFragment',
        openingFragment: {type: 'JSXOpeningFragment'},
        closingFragment: {type: 'JSXClosingFragment'},
        children: [result]
      }
      state.patch(tree, result)
    }

    /** @type {ExpressionStatement} */
    // @ts-expect-error Types are wrong (`expression` *can* be JSX).
    const statement = {type: 'ExpressionStatement', expression: result}
    state.patch(tree, statement)
    body.push(statement)
  }

  /** @type {Program} */
  const program = {
    type: 'Program',
    body,
    sourceType: 'module',
    comments: state.comments
  }
  state.patch(tree, program)
  return program
}
