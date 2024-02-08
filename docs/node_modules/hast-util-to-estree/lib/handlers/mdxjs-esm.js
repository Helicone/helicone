/**
 * @typedef {import('mdast-util-mdxjs-esm').MdxjsEsm} MdxjsEsm
 * @typedef {import('../state.js').State} State
 */

import {attachComments} from 'estree-util-attach-comments'

/**
 * Handle an MDX ESM node.
 *
 * @param {MdxjsEsm} node
 *   hast node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {void}
 *   Nothing.
 */
export function mdxjsEsm(node, state) {
  const estree = node.data && node.data.estree
  const comments = (estree && estree.comments) || []

  if (estree) {
    state.comments.push(...comments)
    attachComments(estree, comments)
    state.esm.push(...estree.body)
  }
}
