/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Nodes} Nodes
 * @typedef {import('hast').Root} Root
 * @typedef {import('hast').RootContent} RootContent
 *
 * @typedef {import('property-information').Info} Info
 * @typedef {import('property-information').Schema} Schema
 */

/**
 * @typedef {Element | Root} Result
 *   Result from a `h` (or `s`) call.
 *
 * @typedef {number | string} StyleValue
 *   Value for a CSS style field.
 * @typedef {Record<string, StyleValue>} Style
 *   Supported value of a `style` prop.
 * @typedef {boolean | number | string | null | undefined} PrimitiveValue
 *   Primitive property value.
 * @typedef {Array<number | string>} ArrayValue
 *   List of property values for space- or comma separated values (such as `className`).
 * @typedef {ArrayValue | PrimitiveValue} PropertyValue
 *   Primitive value or list value.
 * @typedef {{[property: string]: PropertyValue | Style}} Properties
 *   Acceptable value for element properties.
 *
 * @typedef {number | string | null | undefined} PrimitiveChild
 *   Primitive children, either ignored (nullish), or turned into text nodes.
 * @typedef {Array<ArrayChildNested | Nodes | PrimitiveChild>} ArrayChild
 *   List of children.
 * @typedef {Array<Nodes | PrimitiveChild>} ArrayChildNested
 *   List of children (deep).
 * @typedef {ArrayChild | Nodes | PrimitiveChild} Child
 *   Acceptable child value.
 */

import {parse as commas} from 'comma-separated-tokens'
import {parseSelector} from 'hast-util-parse-selector'
import {find, normalize} from 'property-information'
import {parse as spaces} from 'space-separated-tokens'

const buttonTypes = new Set(['button', 'menu', 'reset', 'submit'])

const own = {}.hasOwnProperty

/**
 * @param {Schema} schema
 *   Schema to use.
 * @param {string} defaultTagName
 *   Default tag name.
 * @param {Array<string> | undefined} [caseSensitive]
 *   Case-sensitive tag names (default: `undefined`).
 * @returns
 *   `h`.
 */
export function createH(schema, defaultTagName, caseSensitive) {
  const adjust = caseSensitive && createAdjustMap(caseSensitive)

  /**
   * Hyperscript compatible DSL for creating virtual hast trees.
   *
   * @overload
   * @param {null | undefined} [selector]
   * @param {...Child} children
   * @returns {Root}
   *
   * @overload
   * @param {string} selector
   * @param {Properties} properties
   * @param {...Child} children
   * @returns {Element}
   *
   * @overload
   * @param {string} selector
   * @param {...Child} children
   * @returns {Element}
   *
   * @param {string | null | undefined} [selector]
   *   Selector.
   * @param {Child | Properties | null | undefined} [properties]
   *   Properties (or first child) (default: `undefined`).
   * @param {...Child} children
   *   Children.
   * @returns {Result}
   *   Result.
   */
  function h(selector, properties, ...children) {
    let index = -1
    /** @type {Result} */
    let node

    if (selector === undefined || selector === null) {
      node = {type: 'root', children: []}
      // Properties are not supported for roots.
      const child = /** @type {Child} */ (properties)
      children.unshift(child)
    } else {
      node = parseSelector(selector, defaultTagName)
      // Normalize the name.
      node.tagName = node.tagName.toLowerCase()
      if (adjust && own.call(adjust, node.tagName)) {
        node.tagName = adjust[node.tagName]
      }

      // Handle props.
      if (isProperties(properties, node.tagName)) {
        /** @type {string} */
        let key

        for (key in properties) {
          if (own.call(properties, key)) {
            addProperty(schema, node.properties, key, properties[key])
          }
        }
      } else {
        children.unshift(properties)
      }
    }

    // Handle children.
    while (++index < children.length) {
      addChild(node.children, children[index])
    }

    if (node.type === 'element' && node.tagName === 'template') {
      node.content = {type: 'root', children: node.children}
      node.children = []
    }

    return node
  }

  return h
}

/**
 * Check if something is properties or a child.
 *
 * @param {Child | Properties} value
 *   Value to check.
 * @param {string} name
 *   Tag name.
 * @returns {value is Properties}
 *   Whether `value` is a properties object.
 */
function isProperties(value, name) {
  if (
    value === null ||
    value === undefined ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return false
  }

  if (name === 'input' || !value.type || typeof value.type !== 'string') {
    return true
  }

  if ('children' in value && Array.isArray(value.children)) {
    return false
  }

  if (name === 'button') {
    return buttonTypes.has(value.type.toLowerCase())
  }

  return !('value' in value)
}

/**
 * @param {Schema} schema
 *   Schema.
 * @param {Properties} properties
 *   Properties object.
 * @param {string} key
 *   Property name.
 * @param {PropertyValue | Style} value
 *   Property value.
 * @returns {undefined}
 *   Nothing.
 */
function addProperty(schema, properties, key, value) {
  const info = find(schema, key)
  let index = -1
  /** @type {PropertyValue} */
  let result

  // Ignore nullish and NaN values.
  if (value === undefined || value === null) return

  if (typeof value === 'number') {
    // Ignore NaN.
    if (Number.isNaN(value)) return

    result = value
  }
  // Booleans.
  else if (typeof value === 'boolean') {
    result = value
  }
  // Handle list values.
  else if (typeof value === 'string') {
    if (info.spaceSeparated) {
      result = spaces(value)
    } else if (info.commaSeparated) {
      result = commas(value)
    } else if (info.commaOrSpaceSeparated) {
      result = spaces(commas(value).join(' '))
    } else {
      result = parsePrimitive(info, info.property, value)
    }
  } else if (Array.isArray(value)) {
    result = value.concat()
  } else {
    result = info.property === 'style' ? style(value) : String(value)
  }

  if (Array.isArray(result)) {
    /** @type {Array<number | string>} */
    const finalResult = []

    while (++index < result.length) {
      // Assume no booleans in array.
      const value = /** @type {number | string} */ (
        parsePrimitive(info, info.property, result[index])
      )
      finalResult[index] = value
    }

    result = finalResult
  }

  // Class names (which can be added both on the `selector` and here).
  if (info.property === 'className' && Array.isArray(properties.className)) {
    // Assume no booleans in `className`.
    const value = /** @type {number | string} */ (result)
    result = properties.className.concat(value)
  }

  properties[info.property] = result
}

/**
 * @param {Array<RootContent>} nodes
 *   Children.
 * @param {Child} value
 *   Child.
 * @returns {undefined}
 *   Nothing.
 */
function addChild(nodes, value) {
  let index = -1

  if (value === undefined || value === null) {
    // Empty.
  } else if (typeof value === 'string' || typeof value === 'number') {
    nodes.push({type: 'text', value: String(value)})
  } else if (Array.isArray(value)) {
    while (++index < value.length) {
      addChild(nodes, value[index])
    }
  } else if (typeof value === 'object' && 'type' in value) {
    if (value.type === 'root') {
      addChild(nodes, value.children)
    } else {
      nodes.push(value)
    }
  } else {
    throw new Error('Expected node, nodes, or string, got `' + value + '`')
  }
}

/**
 * Parse a single primitives.
 *
 * @param {Info} info
 *   Property information.
 * @param {string} name
 *   Property name.
 * @param {PrimitiveValue} value
 *   Property value.
 * @returns {PrimitiveValue}
 *   Property value.
 */
function parsePrimitive(info, name, value) {
  if (typeof value === 'string') {
    if (info.number && value && !Number.isNaN(Number(value))) {
      return Number(value)
    }

    if (
      (info.boolean || info.overloadedBoolean) &&
      (value === '' || normalize(value) === normalize(name))
    ) {
      return true
    }
  }

  return value
}

/**
 * Serialize a `style` object as a string.
 *
 * @param {Style} value
 *   Style object.
 * @returns {string}
 *   CSS string.
 */
function style(value) {
  /** @type {Array<string>} */
  const result = []
  /** @type {string} */
  let key

  for (key in value) {
    if (own.call(value, key)) {
      result.push([key, value[key]].join(': '))
    }
  }

  return result.join('; ')
}

/**
 * Create a map to adjust casing.
 *
 * @param {Array<string>} values
 *   List of properly cased keys.
 * @returns {Record<string, string>}
 *   Map of lowercase keys to uppercase keys.
 */
function createAdjustMap(values) {
  /** @type {Record<string, string>} */
  const result = {}
  let index = -1

  while (++index < values.length) {
    result[values[index].toLowerCase()] = values[index]
  }

  return result
}
