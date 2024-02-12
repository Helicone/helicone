/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').ElementData} ElementData
 * @typedef {import('hast').Nodes} Nodes
 * @typedef {import('hast').Root} Root
 * @typedef {import('hast').RootContent} RootContent
 *
 * @typedef {import('parse5').DefaultTreeAdapterMap} DefaultTreeAdapterMap
 * @typedef {import('parse5').Token.ElementLocation} P5ElementLocation
 * @typedef {import('parse5').Token.Location} P5Location
 *
 * @typedef {import('property-information').Schema} Schema
 *
 * @typedef {import('unist').Point} Point
 * @typedef {import('unist').Position} Position
 *
 * @typedef {import('vfile').VFile} VFile
 */

/**
 * @typedef {DefaultTreeAdapterMap['document']} P5Document
 * @typedef {DefaultTreeAdapterMap['documentFragment']} P5DocumentFragment
 * @typedef {DefaultTreeAdapterMap['documentType']} P5DocumentType
 * @typedef {DefaultTreeAdapterMap['commentNode']} P5Comment
 * @typedef {DefaultTreeAdapterMap['textNode']} P5Text
 * @typedef {DefaultTreeAdapterMap['element']} P5Element
 * @typedef {DefaultTreeAdapterMap['node']} P5Node
 * @typedef {DefaultTreeAdapterMap['template']} P5Template
 */

/**
 * @typedef Options
 *   Configuration.
 * @property {Space | null | undefined} [space='html']
 *   Which space the document is in (default: `'html'`).
 *
 *   When an `<svg>` element is found in the HTML space, this package already
 *   automatically switches to and from the SVG space when entering and exiting
 *   it.
 * @property {VFile | null | undefined} [file]
 *   File used to add positional info to nodes (optional).
 *
 *   If given, the file should represent the original HTML source.
 * @property {boolean | null | undefined} [verbose=false]
 *   Whether to add extra positional info about starting tags, closing tags,
 *   and attributes to elements (default: `false`).
 *
 *   > 👉 **Note**: only used when `file` is given.
 *
 * @typedef {'html' | 'svg'} Space
 *   Namespace.
 *
 * @typedef State
 *   Info passed around about the current state.
 * @property {VFile | undefined} file
 *   Corresponding file.
 * @property {boolean} location
 *   Whether location info was found.
 * @property {Schema} schema
 *   Current schema.
 * @property {boolean | undefined} verbose
 *   Add extra positional info.
 */

import {ok as assert} from 'devlop'
import {h, s} from 'hastscript'
import {find, html, svg} from 'property-information'
import {location} from 'vfile-location'
import {webNamespaces} from 'web-namespaces'

const own = {}.hasOwnProperty
/** @type {unknown} */
// type-coverage:ignore-next-line
const proto = Object.prototype

/**
 * Transform a `parse5` AST to hast.
 *
 * @param {P5Node} tree
 *   `parse5` tree to transform.
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {Nodes}
 *   hast tree.
 */
export function fromParse5(tree, options) {
  const settings = options || {}

  return one(
    {
      file: settings.file || undefined,
      location: false,
      schema: settings.space === 'svg' ? svg : html,
      verbose: settings.verbose || false
    },
    tree
  )
}

/**
 * Transform a node.
 *
 * @param {State} state
 *   Info passed around about the current state.
 * @param {P5Node} node
 *   p5 node.
 * @returns {Nodes}
 *   hast node.
 */
function one(state, node) {
  /** @type {Nodes} */
  let result

  switch (node.nodeName) {
    case '#comment': {
      const reference = /** @type {P5Comment} */ (node)
      result = {type: 'comment', value: reference.data}
      patch(state, reference, result)
      return result
    }

    case '#document':
    case '#document-fragment': {
      const reference = /** @type {P5Document | P5DocumentFragment} */ (node)
      const quirksMode =
        'mode' in reference
          ? reference.mode === 'quirks' || reference.mode === 'limited-quirks'
          : false

      result = {
        type: 'root',
        children: all(state, node.childNodes),
        data: {quirksMode}
      }

      if (state.file && state.location) {
        const doc = String(state.file)
        const loc = location(doc)
        const start = loc.toPoint(0)
        const end = loc.toPoint(doc.length)
        // Always defined as we give valid input.
        assert(start, 'expected `start`')
        assert(end, 'expected `end`')
        result.position = {start, end}
      }

      return result
    }

    case '#documentType': {
      const reference = /** @type {P5DocumentType} */ (node)
      result = {type: 'doctype'}
      patch(state, reference, result)
      return result
    }

    case '#text': {
      const reference = /** @type {P5Text} */ (node)
      result = {type: 'text', value: reference.value}
      patch(state, reference, result)
      return result
    }

    // Element.
    default: {
      const reference = /** @type {P5Element} */ (node)
      result = element(state, reference)
      return result
    }
  }
}

/**
 * Transform children.
 *
 * @param {State} state
 *   Info passed around about the current state.
 * @param {Array<P5Node>} nodes
 *   Nodes.
 * @returns {Array<RootContent>}
 *   hast nodes.
 */
function all(state, nodes) {
  let index = -1
  /** @type {Array<RootContent>} */
  const results = []

  while (++index < nodes.length) {
    // Assume no roots in `nodes`.
    const result = /** @type {RootContent} */ (one(state, nodes[index]))
    results.push(result)
  }

  return results
}

/**
 * Transform an element.
 *
 * @param {State} state
 *   Info passed around about the current state.
 * @param {P5Element} node
 *   `parse5` node to transform.
 * @returns {Element}
 *   hast node.
 */
function element(state, node) {
  const schema = state.schema

  state.schema = node.namespaceURI === webNamespaces.svg ? svg : html

  // Props.
  let index = -1
  /** @type {Record<string, string>} */
  const props = {}

  while (++index < node.attrs.length) {
    const attribute = node.attrs[index]
    const name =
      (attribute.prefix ? attribute.prefix + ':' : '') + attribute.name
    if (!own.call(proto, name)) {
      props[name] = attribute.value
    }
  }

  // Build.
  const fn = state.schema.space === 'svg' ? s : h
  const result = fn(node.tagName, props, all(state, node.childNodes))
  patch(state, node, result)

  // Switch content.
  if (result.tagName === 'template') {
    const reference = /** @type {P5Template} */ (node)
    const pos = reference.sourceCodeLocation
    const startTag = pos && pos.startTag && position(pos.startTag)
    const endTag = pos && pos.endTag && position(pos.endTag)

    // Root in, root out.
    const content = /** @type {Root} */ (one(state, reference.content))

    if (startTag && endTag && state.file) {
      content.position = {start: startTag.end, end: endTag.start}
    }

    result.content = content
  }

  state.schema = schema

  return result
}

/**
 * Patch positional info from `from` onto `to`.
 *
 * @param {State} state
 *   Info passed around about the current state.
 * @param {P5Node} from
 *   p5 node.
 * @param {Nodes} to
 *   hast node.
 * @returns {undefined}
 *   Nothing.
 */
function patch(state, from, to) {
  if ('sourceCodeLocation' in from && from.sourceCodeLocation && state.file) {
    const position = createLocation(state, to, from.sourceCodeLocation)

    if (position) {
      state.location = true
      to.position = position
    }
  }
}

/**
 * Create clean positional information.
 *
 * @param {State} state
 *   Info passed around about the current state.
 * @param {Nodes} node
 *   hast node.
 * @param {P5ElementLocation} location
 *   p5 location info.
 * @returns {Position | undefined}
 *   Position, or nothing.
 */
function createLocation(state, node, location) {
  const result = position(location)

  if (node.type === 'element') {
    const tail = node.children[node.children.length - 1]

    // Bug for unclosed with children.
    // See: <https://github.com/inikulin/parse5/issues/109>.
    if (
      result &&
      !location.endTag &&
      tail &&
      tail.position &&
      tail.position.end
    ) {
      result.end = Object.assign({}, tail.position.end)
    }

    if (state.verbose) {
      /** @type {Record<string, Position | undefined>} */
      const props = {}
      /** @type {string} */
      let key

      if (location.attrs) {
        for (key in location.attrs) {
          if (own.call(location.attrs, key)) {
            props[find(state.schema, key).property] = position(
              location.attrs[key]
            )
          }
        }
      }

      assert(location.startTag, 'a start tag should exist')
      const opening = position(location.startTag)
      const closing = location.endTag ? position(location.endTag) : undefined
      /** @type {ElementData['position']} */
      const data = {opening}
      if (closing) data.closing = closing
      data.properties = props

      node.data = {position: data}
    }
  }

  return result
}

/**
 * Turn a p5 location into a position.
 *
 * @param {P5Location} loc
 *   Location.
 * @returns {Position | undefined}
 *   Position or nothing.
 */
function position(loc) {
  const start = point({
    line: loc.startLine,
    column: loc.startCol,
    offset: loc.startOffset
  })
  const end = point({
    line: loc.endLine,
    column: loc.endCol,
    offset: loc.endOffset
  })

  // @ts-expect-error: we do use `undefined` for points if one or the other
  // exists.
  return start || end ? {start, end} : undefined
}

/**
 * Filter out invalid points.
 *
 * @param {Point} point
 *   Point with potentially `undefined` values.
 * @returns {Point | undefined}
 *   Point or nothing.
 */
function point(point) {
  return point.line && point.column ? point : undefined
}
