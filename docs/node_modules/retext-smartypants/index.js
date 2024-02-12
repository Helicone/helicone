/**
 * @typedef {import('nlcst').Root} Root
 * @typedef {import('nlcst').Sentence} Sentence
 * @typedef {import('nlcst').Word} Word
 * @typedef {import('nlcst').Symbol} Symbol
 * @typedef {import('nlcst').Punctuation} Punctuation
 * @typedef {import('nlcst').SentenceContent} SentenceContent
 *
 * @typedef QuoteCharacterMap
 *   Quote characters.
 * @property {string} double
 *   Character to use for double quotes.
 * @property {string} single
 *   Character to use for single quotes.
 *
 * @typedef Options
 *   Configuration.
 * @property {boolean} [quotes=true]
 *   Create smart quotes.
 *
 *   Converts straight double and single quotes to smart double or single
 *   quotes.
 * @property {QuoteCharacterMap} [openingQuotes]
 *   Characters to use for opening double and single quotes.
 * @property {QuoteCharacterMap} [closingQuotes]
 *   Characters to use for closing double and single quotes.
 * @property {boolean} [ellipses=true]
 *   Create smart ellipses.
 *
 *   Converts triple dot characters (with or without spaces between) into a
 *   single Unicode ellipsis character.
 * @property {boolean|'all'} [backticks=true]
 *   Create smart quotes from backticks.
 *
 *   When `true`, converts double back-ticks into an opening double quote, and
 *   double straight single quotes into a closing double quote.
 *
 *   When `'all'`: does the preceding and converts single back-ticks into an
 *   opening single quote, and a straight single quote into a closing single
 *   smart quote.
 *
 *   Note: Quotes can not be `true` when `backticks` is `'all'`;
 * @property {boolean|'oldschool'|'inverted'} [dashes=true]
 *   Create smart dashes.
 *
 *   When `true`, converts two dashes into an em-dash character.
 *
 *   When `'oldschool'`, converts two dashes into an en-dash, and three dashes
 *   into an em-dash.
 *
 *   When `'inverted'`, converts two dashes into an em-dash, and three dashes
 *   into an en-dash.
 *
 * @callback Method
 * @param {Punctuation|Symbol} node
 * @param {number} index
 * @param {Word|Sentence} parent
 * @returns {void}
 */

import {visit} from 'unist-util-visit'
import {toString} from 'nlcst-to-string'

const defaultClosingQuotes = {'"': '”', "'": '’'}
const defaultOpeningQuotes = {'"': '“', "'": '‘'}

/**
 * @param {Options} options
 */
function createEducators(options) {
  const closingQuotes = options.closingQuotes
    ? {'"': options.closingQuotes.double, "'": options.closingQuotes.single}
    : defaultClosingQuotes
  const openingQuotes = options.openingQuotes
    ? {'"': options.openingQuotes.double, "'": options.openingQuotes.single}
    : defaultOpeningQuotes

  const educators = {
    dashes: {
      /**
       * Transform two dahes into an em-dash.
       *
       * @type {Method}
       */
      true(node) {
        if (node.value === '--') {
          node.value = '—'
        }
      },
      /**
       * Transform three dahes into an em-dash, and two into an en-dash.
       *
       * @type {Method}
       */
      oldschool(node) {
        if (node.value === '---') {
          node.value = '—'
        } else if (node.value === '--') {
          node.value = '–'
        }
      },
      /**
       * Transform three dahes into an en-dash, and two into an em-dash.
       *
       * @type {Method}
       */
      inverted(node) {
        if (node.value === '---') {
          node.value = '–'
        } else if (node.value === '--') {
          node.value = '—'
        }
      }
    },
    backticks: {
      /**
       * Transform double backticks and single quotes into smart quotes.
       *
       * @type {Method}
       */
      true(node) {
        if (node.value === '``') {
          node.value = '“'
        } else if (node.value === "''") {
          node.value = '”'
        }
      },
      /**
       * Transform single and double backticks and single quotes into smart quotes.
       *
       * @type {Method}
       */
      all(node, index, parent) {
        educators.backticks.true(node, index, parent)

        if (node.value === '`') {
          node.value = '‘'
        } else if (node.value === "'") {
          node.value = '’'
        }
      }
    },
    ellipses: {
      /**
       * Transform multiple dots into unicode ellipses.
       *
       * @type {Method}
       */
      true(node, index, parent) {
        const value = node.value
        const siblings = parent.children

        // Simple node with three dots and without white-space.
        if (/^\.{3,}$/.test(node.value)) {
          node.value = '…'
          return
        }

        if (!/^\.+$/.test(value)) {
          return
        }

        // Search for dot-nodes with white-space between.
        /** @type {Array<SentenceContent>} */
        const nodes = []
        let position = index
        let count = 1

        // It’s possible that the node is merged with an adjacent word-node.  In that
        // code, we cannot transform it because there’s no reference to the
        // grandparent.
        while (--position > 0) {
          let sibling = siblings[position]

          if (sibling.type !== 'WhiteSpaceNode') {
            break
          }

          const queue = sibling
          sibling = siblings[--position]

          if (
            sibling &&
            (sibling.type === 'PunctuationNode' ||
              sibling.type === 'SymbolNode') &&
            /^\.+$/.test(sibling.value)
          ) {
            nodes.push(queue, sibling)

            count++

            continue
          }

          break
        }

        if (count < 3) {
          return
        }

        siblings.splice(index - nodes.length, nodes.length)

        node.value = '…'
      }
    },
    quotes: {
      /**
       * Transform straight single- and double quotes into smart quotes.
       *
       * @type {Method}
       */
      // eslint-disable-next-line complexity
      true(node, index, parent) {
        const siblings = parent.children
        const value = node.value

        if (value !== '"' && value !== "'") {
          return
        }

        const previous = siblings[index - 1]
        const next = siblings[index + 1]
        const nextNext = siblings[index + 2]
        const nextValue = next && toString(next)

        if (
          next &&
          nextNext &&
          (next.type === 'PunctuationNode' || next.type === 'SymbolNode') &&
          nextNext.type !== 'WordNode'
        ) {
          // Special case if the very first character is a quote followed by
          // punctuation at a non-word-break. Close the quotes by brute force.
          node.value = closingQuotes[value]
        } else if (
          nextNext &&
          (nextValue === '"' || nextValue === "'") &&
          nextNext.type === 'WordNode'
        ) {
          // Special case for double sets of quotes:
          // `He said, "'Quoted' words in a larger quote."`
          node.value = openingQuotes[value]
          // @ts-expect-error: it’s a literal.
          next.value = openingQuotes[nextValue]
        } else if (next && /^\d\ds$/.test(nextValue)) {
          // Special case for decade abbreviations: `the '80s`
          node.value = closingQuotes[value]
        } else if (
          previous &&
          next &&
          (previous.type === 'WhiteSpaceNode' ||
            previous.type === 'PunctuationNode' ||
            previous.type === 'SymbolNode') &&
          next.type === 'WordNode'
        ) {
          // Get most opening single quotes.
          node.value = openingQuotes[value]
        } else if (
          previous &&
          previous.type !== 'WhiteSpaceNode' &&
          previous.type !== 'SymbolNode' &&
          previous.type !== 'PunctuationNode'
        ) {
          // Closing quotes.
          node.value = closingQuotes[value]
        } else if (
          !next ||
          next.type === 'WhiteSpaceNode' ||
          (value === "'" && nextValue === 's')
        ) {
          node.value = closingQuotes[value]
        } else {
          node.value = openingQuotes[value]
        }
      }
    }
  }

  return educators
}

/**
 * Plugin to replace dumb/straight/typewriter punctuation marks with smart/curly
 * punctuation marks.
 *
 * @type {import('unified').Plugin<[Options?]|[], Root>}
 */
export default function retextSmartypants(options = {}) {
  /** @type {Array<Method>} */
  const methods = []
  /** @type {Options['quotes']} */
  let quotes
  /** @type {Options['ellipses']} */
  let ellipses
  /** @type {Options['backticks']} */
  let backticks
  /** @type {Options['dashes']} */
  let dashes

  if ('quotes' in options) {
    quotes = options.quotes

    if (quotes !== Boolean(quotes)) {
      throw new TypeError(
        'Illegal invocation: `' +
          quotes +
          '` ' +
          'is not a valid value for `quotes` in ' +
          '`smartypants`'
      )
    }
  } else {
    quotes = true
  }

  if ('ellipses' in options) {
    ellipses = options.ellipses

    if (ellipses !== Boolean(ellipses)) {
      throw new TypeError(
        'Illegal invocation: `' +
          ellipses +
          '` ' +
          'is not a valid value for `ellipses` in ' +
          '`smartypants`'
      )
    }
  } else {
    ellipses = true
  }

  if ('backticks' in options) {
    backticks = options.backticks

    if (backticks !== Boolean(backticks) && backticks !== 'all') {
      throw new TypeError(
        'Illegal invocation: `' +
          backticks +
          '` ' +
          'is not a valid value for `backticks` in ' +
          '`smartypants`'
      )
    }

    if (backticks === 'all' && quotes === true) {
      throw new TypeError(
        'Illegal invocation: `backticks: ' +
          backticks +
          '` is not a valid value ' +
          'when `quotes: ' +
          quotes +
          '` in ' +
          '`smartypants`'
      )
    }
  } else {
    backticks = true
  }

  if ('dashes' in options) {
    dashes = options.dashes

    if (
      dashes !== Boolean(dashes) &&
      dashes !== 'oldschool' &&
      dashes !== 'inverted'
    ) {
      throw new TypeError(
        'Illegal invocation: `' +
          dashes +
          '` ' +
          'is not a valid value for `dahes` in ' +
          '`smartypants`'
      )
    }
  } else {
    dashes = true
  }

  const educators = createEducators(options)

  if (quotes !== false) {
    methods.push(educators.quotes.true)
  }

  if (ellipses !== false) {
    methods.push(educators.ellipses.true)
  }

  if (backticks !== false) {
    methods.push(educators.backticks[backticks === true ? 'true' : backticks])
  }

  if (dashes !== false) {
    methods.push(educators.dashes[dashes === true ? 'true' : dashes])
  }

  return (tree) => {
    visit(tree, (node, position, parent) => {
      let index = -1

      if (node.type === 'PunctuationNode' || node.type === 'SymbolNode') {
        while (++index < methods.length) {
          // @ts-expect-error: they’re literals.
          methods[index](node, position, parent)
        }
      }
    })
  }
}
