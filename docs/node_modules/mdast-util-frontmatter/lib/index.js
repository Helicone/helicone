/**
 * @typedef {import('mdast').Literal} Literal
 * @typedef {import('mdast-util-from-markdown').Extension} FromMarkdownExtension
 * @typedef {import('mdast-util-from-markdown').CompileContext} CompileContext
 * @typedef {import('mdast-util-from-markdown').Handle} FromMarkdownHandle
 * @typedef {import('mdast-util-to-markdown').Options} ToMarkdownExtension
 *
 * @typedef {import('micromark-extension-frontmatter').Options} Options
 * @typedef {import('micromark-extension-frontmatter/matters.js').Matter} Matter
 * @typedef {import('micromark-extension-frontmatter/matters.js').Info} Info
 */

import {matters} from 'micromark-extension-frontmatter/matters.js'

/**
 * Create an extension for `mdast-util-from-markdown`.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration.
 * @returns {FromMarkdownExtension}
 *   Extension for `mdast-util-from-markdown`.
 */
export function frontmatterFromMarkdown(options) {
  // @ts-expect-error: `micromark-extension-frontmatter` should fix types to
  // accept `null` as options.
  const settings = matters(options)
  /** @type {FromMarkdownExtension['enter']} */
  const enter = {}
  /** @type {FromMarkdownExtension['exit']} */
  const exit = {}
  let index = -1

  while (++index < settings.length) {
    const matter = settings[index]
    enter[matter.type] = opener(matter)
    exit[matter.type] = close
    exit[matter.type + 'Value'] = value
  }

  return {enter, exit}
}

/**
 * @param {Matter} matter
 * @returns {FromMarkdownHandle} enter
 */
function opener(matter) {
  return open

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function open(token) {
    // @ts-expect-error: custom.
    this.enter({type: matter.type, value: ''}, token)
    this.buffer()
  }
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function close(token) {
  const data = this.resume()
  const node = /** @type {Literal} */ (this.exit(token))
  // Remove the initial and final eol.
  node.value = data.replace(/^(\r?\n|\r)|(\r?\n|\r)$/g, '')
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function value(token) {
  this.config.enter.data.call(this, token)
  this.config.exit.data.call(this, token)
}

/**
 * Create an extension for `mdast-util-to-markdown`.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration.
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown`.
 */
export function frontmatterToMarkdown(options) {
  // To do: use an extension object with `satisfies` later.
  /** @type {ToMarkdownExtension['unsafe']} */
  const unsafe = []
  /** @type {ToMarkdownExtension['handlers']} */
  const handlers = {}
  // @ts-expect-error: `micromark-extension-frontmatter` should fix types to
  // accept `null` as options.
  const settings = matters(options)
  let index = -1

  while (++index < settings.length) {
    const matter = settings[index]

    // @ts-expect-error: this can add custom frontmatter nodes.
    // Typing those is the responsibility of the end user.
    handlers[matter.type] = handler(matter)

    // To do: idea: perhaps make this smarter, with an `after` of the second char?
    unsafe.push({atBreak: true, character: fence(matter, 'open').charAt(0)})
  }

  return {unsafe, handlers}
}

/**
 * Create a handle that can serialize a frontmatter node as markdown.
 *
 * @param {Matter} matter
 *   Structure.
 * @returns {(node: Literal) => string} enter
 *   Handler.
 */
function handler(matter) {
  const open = fence(matter, 'open')
  const close = fence(matter, 'close')

  return handle

  /**
   * Serialize a frontmatter node as markdown.
   *
   * @param {Literal} node
   *   Node to serialize.
   * @returns {string}
   *   Serialized node.
   */
  function handle(node) {
    return open + (node.value ? '\n' + node.value : '') + '\n' + close
  }
}

/**
 * Get an `open` or `close` fence.
 *
 * @param {Matter} matter
 *   Structure.
 * @param {'open' | 'close'} prop
 *   Field to get.
 * @returns {string}
 *   Fence.
 */
function fence(matter, prop) {
  return matter.marker
    ? pick(matter.marker, prop).repeat(3)
    : // @ts-expect-error: They’re mutually exclusive.
      pick(matter.fence, prop)
}

/**
 * Take `open` or `close` fields when schema is an info object, or use the
 * given value when it is a string.
 *
 * @param {Info | string} schema
 *   Info object or value.
 * @param {'open' | 'close'} prop
 *   Field to get.
 * @returns {string}
 *   Thing to use for the opening or closing.
 */
function pick(schema, prop) {
  return typeof schema === 'string' ? schema : schema[prop]
}
