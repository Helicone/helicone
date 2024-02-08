/**
 * @typedef {import('hast').Root} Root
 * @typedef {import('estree-jsx').JSXFragment} JsxFragment
 * @typedef {JsxFragment['children'][number]} JsxChild
 * @typedef {import('../state.js').State} State
 */

import {whitespace} from 'hast-util-whitespace'

/**
 * Turn a hast root node into an estree node.
 *
 * @param {Root} node
 *   hast node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {JsxFragment}
 *   estree JSX fragment.
 */
export function root(node, state) {
  const children = state.all(node)
  /** @type {Array<JsxChild>} */
  const cleanChildren = []
  let index = -1
  /** @type {Array<JsxChild> | undefined} */
  let queue

  // Remove surrounding whitespace nodes from the fragment.
  while (++index < children.length) {
    const child = children[index]

    if (
      child.type === 'JSXExpressionContainer' &&
      child.expression.type === 'Literal' &&
      whitespace(child.expression.value)
    ) {
      if (queue) queue.push(child)
    } else {
      if (queue) cleanChildren.push(...queue)
      cleanChildren.push(child)
      queue = []
    }
  }

  /** @type {JsxFragment} */
  const result = {
    type: 'JSXFragment',
    openingFragment: {type: 'JSXOpeningFragment'},
    closingFragment: {type: 'JSXClosingFragment'},
    children: cleanChildren
  }
  state.inherit(node, result)
  return result
}
