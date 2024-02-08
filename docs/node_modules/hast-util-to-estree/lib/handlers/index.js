import {comment} from './comment.js'
import {element} from './element.js'
import {mdxExpression} from './mdx-expression.js'
import {mdxJsxElement} from './mdx-jsx-element.js'
import {mdxjsEsm} from './mdxjs-esm.js'
import {text} from './text.js'
import {root} from './root.js'

export const handlers = {
  comment,
  doctype: ignore,
  element,
  mdxFlowExpression: mdxExpression,
  mdxTextExpression: mdxExpression,
  mdxJsxFlowElement: mdxJsxElement,
  mdxJsxTextElement: mdxJsxElement,
  mdxjsEsm,
  text,
  root
}

/**
 * Handle a node that is ignored.
 *
 * @returns {void}
 *   Nothing.
 */
function ignore() {}
