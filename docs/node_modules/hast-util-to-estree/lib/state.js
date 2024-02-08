/**
 * @typedef {import('estree').Comment} Comment
 * @typedef {import('estree').Directive} Directive
 * @typedef {import('estree').ModuleDeclaration} ModuleDeclaration
 * @typedef {import('estree').Node} EstreeNode
 * @typedef {import('estree').Statement} Statement
 *
 * @typedef {import('estree-jsx').JSXAttribute} JsxAttribute
 * @typedef {import('estree-jsx').JSXElement} JsxElement
 * @typedef {import('estree-jsx').JSXIdentifier} JsxIdentifier
 * @typedef {import('estree-jsx').JSXMemberExpression} JsxMemberExpression
 * @typedef {import('estree-jsx').JSXNamespacedName} JsxNamespacedName
 *
 * @typedef {import('hast').Content} Content
 * @typedef {import('hast').Root} Root
 *
 * @typedef {import('mdast-util-mdx-expression').MdxFlowExpression} MdxFlowExpression
 * @typedef {import('mdast-util-mdx-expression').MdxTextExpression} MdxTextExpression
 *
 * @typedef {import('mdast-util-mdx-jsx').MdxJsxAttribute} MdxJsxAttribute
 * @typedef {import('mdast-util-mdx-jsx').MdxJsxAttributeValueExpression} MdxJsxAttributeValueExpression
 * @typedef {import('mdast-util-mdx-jsx').MdxJsxExpressionAttribute} MdxJsxExpressionAttribute
 * @typedef {import('mdast-util-mdx-jsx').MdxJsxFlowElement} MdxJsxFlowElement
 * @typedef {import('mdast-util-mdx-jsx').MdxJsxTextElement} MdxJsxTextElement
 *
 * @typedef {import('property-information').Schema} Schema
 *
 * @typedef {import('unist').Parent} UnistParent
 */

/**
 * @typedef {Content | MdxJsxAttributeValueExpression | MdxJsxAttribute | MdxJsxExpressionAttribute | MdxJsxFlowElement | MdxJsxTextElement | MdxFlowExpression | MdxTextExpression | Root} Node
 * @typedef {Extract<Node, UnistParent>} Parent
 * @typedef {JsxElement['openingElement']['name']} JsxElementName
 * @typedef {JsxAttribute['name']} JsxAttributeName
 * @typedef {JsxElement['children'][number]} JsxChild
 *
 * @typedef {'html' | 'svg'} Space
 *   Namespace.
 *
 * @callback Handle
 *   Turn a hast node into an estree node.
 * @param {any} node
 *   Expected hast node.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {JsxChild | null | undefined | void}
 *   estree node.
 *
 * @typedef {'html' | 'react'} ElementAttributeNameCase
 *   Specify casing to use for attribute names.
 *
 *   HTML casing is for example `class`, `stroke-linecap`, `xml:lang`.
 *   React casing is for example `className`, `strokeLinecap`, `xmlLang`.
 *
 * @typedef {'css' | 'dom'} StylePropertyNameCase
 *   Casing to use for property names in `style` objects.
 *
 *   CSS casing is for example `background-color` and `-webkit-line-clamp`.
 *   DOM casing is for example `backgroundColor` and `WebkitLineClamp`.
 *
 * @typedef Options
 *   Configuration.
 * @property {ElementAttributeNameCase | null | undefined} [elementAttributeNameCase='react']
 *   Specify casing to use for attribute names.
 *
 *   This casing is used for hast elements, not for embedded MDX JSX nodes
 *   (components that someone authored manually).
 * @property {Record<string, Handle | null | undefined> | null | undefined} [handlers={}]
 *   Custom handlers.
 * @property {Space | null | undefined} [space='html']
 *   Which space the document is in.
 *
 *   When an `<svg>` element is found in the HTML space, this package already
 *   automatically switches to and from the SVG space when entering and exiting
 *   it.
 * @property {StylePropertyNameCase | null | undefined} [stylePropertyNameCase='dom']
 *   Specify casing to use for property names in `style` objects.
 *
 *   This casing is used for hast elements, not for embedded MDX JSX nodes
 *   (components that someone authored manually).
 *
 * @typedef State
 *   Info passed around about the current state.
 * @property {Schema} schema
 *   Current schema.
 * @property {ElementAttributeNameCase} elementAttributeNameCase
 *   Casing to use for attribute names.
 * @property {StylePropertyNameCase} stylePropertyNameCase
 *   Casing to use for property names in `style` objects.
 * @property {Array<Comment>} comments
 *   List of estree comments.
 * @property {Array<Directive | Statement | ModuleDeclaration>} esm
 *   List of top-level estree nodes.
 * @property {(node: any) => JsxChild | null | undefined | void} handle
 *   Transform a hast node to estree.
 * @property {(parent: Parent) => Array<JsxChild>} all
 *   Transform children of a hast parent to estree.
 * @property {(from: Node, to: EstreeNode | Comment) => void} patch
 *   Take positional info from `from` (use `inherit` if you also want data).
 * @property {(from: Node, to: EstreeNode | Comment) => void} inherit
 *   Take positional info and data from `from` (use `patch` if you don’t want data).
 * @property {(name: string) => JsxAttributeName} createJsxAttributeName
 *   Create a JSX attribute name.
 * @property {(name: string) => JsxElementName} createJsxElementName
 *   Create a JSX element name.
 */

import {html, svg} from 'property-information'
import {position} from 'unist-util-position'
import {zwitch} from 'zwitch'
import {handlers} from './handlers/index.js'

const own = {}.hasOwnProperty

// `react-dom` triggers a warning for *any* white space in tables.
// To follow GFM, `mdast-util-to-hast` injects line endings between elements.
// Other tools might do so too, but they don’t do here, so we remove all of
// that.
//
// See: <https://github.com/facebook/react/pull/7081>.
// See: <https://github.com/facebook/react/pull/7515>.
// See: <https://github.com/remarkjs/remark-react/issues/64>.
// See: <https://github.com/rehypejs/rehype-react/pull/29>.
// See: <https://github.com/rehypejs/rehype-react/pull/32>.
// See: <https://github.com/rehypejs/rehype-react/pull/45>.
// See: <https://github.com/mdx-js/mdx/issues/2000>
const tableElements = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr'])

/**
 * Create a state from options.
 *
 * @param {Options} options
 *   Configuration.
 * @returns {State}
 *   Info passed around about the current state.
 */

export function createState(options) {
  /** @type {Handle} */
  const one = zwitch('type', {
    invalid,
    unknown,
    handlers: {...handlers, ...options.handlers}
  })

  return {
    // Current space.
    schema: options.space === 'svg' ? svg : html,
    elementAttributeNameCase: options.elementAttributeNameCase || 'react',
    stylePropertyNameCase: options.stylePropertyNameCase || 'dom',
    // Results.
    comments: [],
    esm: [],
    // Useful functions.
    handle,
    all,
    patch,
    inherit,
    createJsxAttributeName,
    createJsxElementName
  }

  /**
   * @this {State}
   * @param {any} node
   * @returns {JsxChild | null | undefined | void}
   */
  function handle(node) {
    return one(node, this)
  }
}

/**
 * Crash on an invalid value.
 *
 * @param {unknown} value
 *   Non-node.
 * @returns {never}
 *   Nothing (crashes).
 */
function invalid(value) {
  throw new Error('Cannot handle value `' + value + '`, expected node')
}

/**
 * Crash on an unknown node.
 *
 * @param {unknown} node
 *   Unknown node.
 * @returns {never}
 *   Nothing (crashes).
 */
function unknown(node) {
  // @ts-expect-error: JS guarantees there’s a `type`.
  throw new Error('Cannot handle unknown node `' + node.type + '`')
}

/**
 * @this {State} state
 *   Info passed around about the current state.
 * @param {Parent | MdxJsxFlowElement | MdxJsxTextElement} parent
 *   hast node whose children to transform.
 * @returns {Array<JsxChild>}
 *   estree nodes.
 */
function all(parent) {
  const children = parent.children || []
  let index = -1
  /** @type {Array<JsxChild>} */
  const results = []
  const ignoreLineBreak =
    this.schema.space === 'html' &&
    parent.type === 'element' &&
    tableElements.has(parent.tagName.toLowerCase())

  while (++index < children.length) {
    const child = children[index]

    if (ignoreLineBreak && child.type === 'text' && child.value === '\n') {
      continue
    }

    const result = this.handle(child)

    if (Array.isArray(result)) {
      results.push(...result)
    } else if (result) {
      results.push(result)
    }
  }

  return results
}

/**
 * Take positional info and data from `hast`.
 *
 * Use `patch` if you don’t want data.
 *
 * @param {Node | MdxJsxAttributeValueExpression | MdxJsxAttribute | MdxJsxExpressionAttribute | MdxJsxFlowElement | MdxJsxTextElement | MdxFlowExpression | MdxTextExpression} from
 *   hast node to take positional info and data from.
 * @param {EstreeNode | Comment} to
 *   estree node to add positional info and data to.
 * @returns {void}
 *   Nothing.
 */
function inherit(from, to) {
  /** @type {Record<string, unknown> | undefined} */
  const left = from.data
  /** @type {Record<string, unknown> | undefined} */
  let right
  /** @type {string} */
  let key

  patch(from, to)

  if (left) {
    for (key in left) {
      if (own.call(left, key) && key !== 'estree') {
        if (!right) right = {}
        right[key] = left[key]
      }
    }

    if (right) {
      // @ts-expect-error `esast` extension.
      to.data = right
    }
  }
}

/**
 * Take positional info from `from`.
 *
 * Use `inherit` if you also want data.
 *
 * @param {Node | MdxJsxAttributeValueExpression | MdxJsxAttribute | MdxJsxExpressionAttribute | MdxJsxFlowElement | MdxJsxTextElement | MdxFlowExpression | MdxTextExpression} from
 *   hast node to take positional info from.
 * @param {EstreeNode | Comment} to
 *   estree node to add positional info to.
 * @returns {void}
 *   Nothing.
 */
function patch(from, to) {
  const p = position(from)

  if (
    p.start.line &&
    p.start.offset !== undefined &&
    p.end.offset !== undefined
  ) {
    // @ts-expect-error acorn-style.
    to.start = p.start.offset
    // @ts-expect-error acorn-style.
    to.end = p.end.offset
    to.loc = {
      start: {line: p.start.line, column: p.start.column - 1},
      end: {line: p.end.line, column: p.end.column - 1}
    }
    to.range = [p.start.offset, p.end.offset]
  }
}

/**
 * Create a JSX attribute name.
 *
 * @param {string} name
 * @returns {JsxAttributeName}
 */
function createJsxAttributeName(name) {
  const node = createJsxNameFromString(name)

  // MDX never generates this.
  /* c8 ignore next 3 */
  if (node.type === 'JSXMemberExpression') {
    throw new Error('Member expressions in attribute names are not supported')
  }

  return node
}

/**
 * Create a JSX element name.
 *
 * @param {string} name
 * @returns {JsxElementName}
 */
function createJsxElementName(name) {
  return createJsxNameFromString(name)
}

/**
 * Create a JSX name from a string.
 *
 * @param {string} name
 *   Name.
 * @returns {JsxMemberExpression | JsxNamespacedName | JsxIdentifier}
 *   Node.
 */
function createJsxNameFromString(name) {
  if (name.includes('.')) {
    const names = name.split('.')
    let part = names.shift()
    /** @type {JsxMemberExpression} */
    // @ts-expect-error: hush, the first is always defined.
    let node = {type: 'JSXIdentifier', name: part}

    while ((part = names.shift())) {
      node = {
        type: 'JSXMemberExpression',
        object: node,
        property: {type: 'JSXIdentifier', name: part}
      }
    }

    return node
  }

  if (name.includes(':')) {
    const parts = name.split(':')
    return {
      type: 'JSXNamespacedName',
      namespace: {type: 'JSXIdentifier', name: parts[0]},
      name: {type: 'JSXIdentifier', name: parts[1]}
    }
  }

  return {type: 'JSXIdentifier', name}
}
