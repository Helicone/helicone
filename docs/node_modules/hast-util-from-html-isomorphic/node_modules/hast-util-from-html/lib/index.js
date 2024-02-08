/**
 * @typedef {import('hast').Root} Root
 * @typedef {import('parse5').ParserError} ParserError
 * @typedef {import('vfile').Value} Value
 */

/**
 * @typedef {keyof errors} ErrorCode
 *   Known names of parse errors.
 *
 * @typedef {Partial<Record<ErrorCode, ErrorSeverity | null | undefined>>} ErrorOptions
 *   Options that define the severity of errors.
 *
 * @typedef {boolean | 0 | 1 | 2} ErrorSeverity
 *   Error severity:
 *
 *   * `0` or `false`
 *     — turn the parse error off
 *   * `1` or `true`
 *     — turn the parse error into a warning
 *   * `2`
 *     — turn the parse error into an actual error: processing stops.
 *
 * @typedef ExtraOptions
 *   Options that define how to parse HTML.
 * @property {boolean | null | undefined} [fragment=false]
 *   Specify whether to parse a fragment, instead of a complete document
 *   (default: `false`).
 *
 *   In document mode, unopened `html`, `head`, and `body` elements are opened
 *   in just the right places.
 * @property {OnError | null | undefined} [onerror]
 *   Call `onerror` with parse errors while parsing (optional).
 *
 *   > 👉 **Note**: parse errors are currently being added to HTML.
 *   > Not all errors emitted by parse5 (or us) are specced yet.
 *   > Some documentation may still be missing.
 *
 *   Specific rules can be turned off by setting them to `false` (or `0`).
 *   The default, when `emitParseErrors: true`, is `true` (or `1`), and means
 *   that rules emit as warnings.
 *   Rules can also be configured with `2`, to turn them into fatal errors.
 *
 * @typedef {Omit<import('hast-util-from-parse5').Options, 'file'>} FromParse5Options
 *   Options that can be passed through to `hast-util-from-parse5`.
 *
 * @callback OnError
 *   Handle parse errors.
 * @param {VFileMessage} error
 *   Message.
 * @returns {undefined | void}
 *   Nothing.
 *
 *   Note: `void` included until TS infers `undefined` nicely.
 *
 * @typedef {FromParse5Options & ErrorOptions & ExtraOptions} Options
 *   Configuration.
 */

import {ok as assert} from 'devlop'
import {fromParse5} from 'hast-util-from-parse5'
import {parse, parseFragment} from 'parse5'
import {VFile} from 'vfile'
import {VFileMessage} from 'vfile-message'
import {errors} from './errors.js'

const base = 'https://html.spec.whatwg.org/multipage/parsing.html#parse-error-'

const dashToCamelRe = /-[a-z]/g
const formatCRe = /%c(?:([-+])(\d+))?/g
const formatXRe = /%x/g

const fatalities = {2: true, 1: false, 0: null}

/** @type {Readonly<Options>} */
const emptyOptions = {}

/**
 * Turn serialized HTML into a hast tree.
 *
 * @param {VFile | Value} value
 *   Serialized HTML to parse.
 * @param {Readonly<Options> | null | undefined} [options]
 *   Configuration (optional).
 * @returns {Root}
 *   Tree.
 */
export function fromHtml(value, options) {
  const settings = options || emptyOptions
  const onerror = settings.onerror
  const file = value instanceof VFile ? value : new VFile(value)
  const fn = settings.fragment ? parseFragment : parse
  const doc = String(file)
  const p5doc = fn(doc, {
    sourceCodeLocationInfo: true,
    // Note `parse5` types currently do not allow `undefined`.
    onParseError: settings.onerror ? internalOnerror : null,
    scriptingEnabled: false
  })

  // `parse5` returns document which are always mapped to roots.
  return /** @type {Root} */ (
    fromParse5(p5doc, {
      file,
      space: settings.space,
      verbose: settings.verbose
    })
  )

  /**
   * Handle a parse error.
   *
   * @param {ParserError} error
   *   Parse5 error.
   * @returns {undefined}
   *   Nothing.
   */
  function internalOnerror(error) {
    const code = error.code
    const name = camelcase(code)
    const setting = settings[name]
    const config = setting === null || setting === undefined ? true : setting
    const level = typeof config === 'number' ? config : config ? 1 : 0

    if (level) {
      const info = errors[name]
      assert(info, 'expected known error from `parse5`')

      const message = new VFileMessage(format(info.reason), {
        place: {
          start: {
            line: error.startLine,
            column: error.startCol,
            offset: error.startOffset
          },
          end: {
            line: error.endLine,
            column: error.endCol,
            offset: error.endOffset
          }
        },
        ruleId: code,
        source: 'hast-util-from-html'
      })

      if (file.path) {
        message.file = file.path
        message.name = file.path + ':' + message.name
      }

      message.fatal = fatalities[level]
      message.note = format(info.description)
      message.url = info.url === false ? undefined : base + code

      assert(onerror, '`internalOnerror` is not passed if `onerror` is not set')
      onerror(message)
    }

    /**
     * Format a human readable string about an error.
     *
     * @param {string} value
     *   Value to format.
     * @returns {string}
     *   Formatted.
     */
    function format(value) {
      return value.replace(formatCRe, formatC).replace(formatXRe, formatX)

      /**
       * Format the character.
       *
       * @param {string} _
       *   Match.
       * @param {string} $1
       *   Sign (`-` or `+`, optional).
       * @param {string} $2
       *   Offset.
       * @returns {string}
       *   Formatted.
       */
      function formatC(_, $1, $2) {
        const offset =
          ($2 ? Number.parseInt($2, 10) : 0) * ($1 === '-' ? -1 : 1)
        const char = doc.charAt(error.startOffset + offset)
        return visualizeCharacter(char)
      }

      /**
       * Format the character code.
       *
       * @returns {string}
       *   Formatted.
       */
      function formatX() {
        return visualizeCharacterCode(doc.charCodeAt(error.startOffset))
      }
    }
  }
}

/**
 * @param {string} value
 *   Error code in dash case.
 * @returns {ErrorCode}
 *   Error code in camelcase.
 */
function camelcase(value) {
  // This should match an error code.
  return /** @type {ErrorCode} */ (value.replace(dashToCamelRe, dashToCamel))
}

/**
 * @param {string} $0
 *   Match.
 * @returns {string}
 *   Camelcased.
 */
function dashToCamel($0) {
  return $0.charAt(1).toUpperCase()
}

/**
 * @param {string} char
 *   Character.
 * @returns {string}
 *   Formatted.
 */
function visualizeCharacter(char) {
  return char === '`' ? '` ` `' : char
}

/**
 * @param {number} charCode
 *   Character code.
 * @returns {string}
 *   Formatted.
 */
function visualizeCharacterCode(charCode) {
  return '0x' + charCode.toString(16).toUpperCase()
}
