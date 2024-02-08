import {mergeInitialWordSymbol} from './plugin/merge-initial-word-symbol.js'
import {mergeFinalWordSymbol} from './plugin/merge-final-word-symbol.js'
import {mergeInnerWordSymbol} from './plugin/merge-inner-word-symbol.js'
import {mergeInnerWordSlash} from './plugin/merge-inner-word-slash.js'
import {mergeInitialisms} from './plugin/merge-initialisms.js'
import {mergeWords} from './plugin/merge-words.js'
import {patchPosition} from './plugin/patch-position.js'
import {mergeNonWordSentences} from './plugin/merge-non-word-sentences.js'
import {mergeAffixSymbol} from './plugin/merge-affix-symbol.js'
import {mergeInitialLowerCaseLetterSentences} from './plugin/merge-initial-lower-case-letter-sentences.js'
import {mergeInitialDigitSentences} from './plugin/merge-initial-digit-sentences.js'
import {mergePrefixExceptions} from './plugin/merge-prefix-exceptions.js'
import {mergeAffixExceptions} from './plugin/merge-affix-exceptions.js'
import {mergeRemainingFullStops} from './plugin/merge-remaining-full-stops.js'
import {makeInitialWhiteSpaceSiblings} from './plugin/make-initial-white-space-siblings.js'
import {makeFinalWhiteSpaceSiblings} from './plugin/make-final-white-space-siblings.js'
import {breakImplicitSentences} from './plugin/break-implicit-sentences.js'
import {removeEmptyNodes} from './plugin/remove-empty-nodes.js'
import {parserFactory} from './parser.js'
import {
  newLine,
  punctuation,
  surrogates,
  terminalMarker,
  whiteSpace,
  word
} from './expressions.js'

// PARSE LATIN

// Transform Latin-script natural language into an NLCST-tree.
export class ParseLatin {
  constructor(doc, file) {
    const value = file || doc
    this.doc = value ? String(value) : null
  }

  // Run transform plugins for `key` on `nodes`.
  run(key, nodes) {
    const wareKey = key + 'Plugins'
    const plugins = this[wareKey]
    let index = -1

    if (plugins) {
      while (plugins[++index]) {
        plugins[index](nodes)
      }
    }

    return nodes
  }

  // Easy access to the document parser. This additionally supports retext-style
  // invocation: where an instance is created for each file, and the file is given
  // on construction.
  parse(value) {
    return this.tokenizeRoot(value || this.doc)
  }

  // Transform a `value` into a list of `NLCSTNode`s.
  tokenize(value) {
    const tokens = []

    if (value === null || value === undefined) {
      value = ''
    } else if (value instanceof String) {
      value = value.toString()
    }

    if (typeof value !== 'string') {
      // Return the given nodes if this is either an empty array, or an array with
      // a node as a first child.
      if ('length' in value && (!value[0] || value[0].type)) {
        return value
      }

      throw new Error(
        "Illegal invocation: '" +
          value +
          "' is not a valid argument for 'ParseLatin'"
      )
    }

    if (!value) {
      return tokens
    }

    // Eat mechanism to use.
    const eater = this.position ? eat : noPositionEat

    let index = 0
    let offset = 0
    let line = 1
    let column = 1
    let previous = ''
    let queue = ''
    let left
    let right
    let character

    while (index < value.length) {
      character = value.charAt(index)

      if (whiteSpace.test(character)) {
        right = 'WhiteSpace'
      } else if (punctuation.test(character)) {
        right = 'Punctuation'
      } else if (word.test(character)) {
        right = 'Word'
      } else {
        right = 'Symbol'
      }

      tick.call(this)

      previous = character
      character = ''
      left = right
      right = null

      index++
    }

    tick.call(this)

    return tokens

    // Check one character.
    function tick() {
      if (
        left === right &&
        (left === 'Word' ||
          left === 'WhiteSpace' ||
          character === previous ||
          surrogates.test(character))
      ) {
        queue += character
      } else {
        // Flush the previous queue.
        if (queue) {
          this['tokenize' + left](queue, eater)
        }

        queue = character
      }
    }

    // Remove `subvalue` from `value`.
    // Expects `subvalue` to be at the start from `value`, and applies no
    // validation.
    function eat(subvalue) {
      const pos = position()

      update(subvalue)

      return apply

      // Add the given arguments, add `position` to the returned node, and return
      // the node.
      function apply(...input) {
        return pos(add(...input))
      }
    }

    // Remove `subvalue` from `value`.
    // Does not patch positional information.
    function noPositionEat() {
      return add
    }

    // Add mechanism.
    function add(node, parent) {
      if (parent) {
        parent.children.push(node)
      } else {
        tokens.push(node)
      }

      return node
    }

    // Mark position and patch `node.position`.
    function position() {
      const before = now()

      // Add the position to a node.
      function patch(node) {
        node.position = new Position(before)

        return node
      }

      return patch
    }

    // Update line and column based on `value`.
    function update(subvalue) {
      let character = -1
      let lastIndex = -1

      offset += subvalue.length

      while (++character < subvalue.length) {
        if (subvalue.charAt(character) === '\n') {
          lastIndex = character
          line++
        }
      }

      if (lastIndex < 0) {
        column += subvalue.length
      } else {
        column = subvalue.length - lastIndex
      }
    }

    // Store position information for a node.
    function Position(start) {
      this.start = start
      this.end = now()
    }

    // Get the current position.
    function now() {
      return {line, column, offset}
    }
  }
}

// Default position.
ParseLatin.prototype.position = true

// Create text nodes.
ParseLatin.prototype.tokenizeSymbol = createTextFactory('Symbol')
ParseLatin.prototype.tokenizeWhiteSpace = createTextFactory('WhiteSpace')
ParseLatin.prototype.tokenizePunctuation = createTextFactory('Punctuation')
ParseLatin.prototype.tokenizeSource = createTextFactory('Source')
ParseLatin.prototype.tokenizeText = createTextFactory('Text')

// Inject `plugins` to modifiy the result of the method at `key` on the operated
// on context.
ParseLatin.prototype.use = useFactory(function (context, key, plugins) {
  context[key] = context[key].concat(plugins)
})

// Inject `plugins` to modifiy the result of the method at `key` on the operated
// on context, before any other.
ParseLatin.prototype.useFirst = useFactory(function (context, key, plugins) {
  context[key] = plugins.concat(context[key])
})

// PARENT NODES
//
// All these nodes are `pluggable`: they come with a `use` method which accepts
// a plugin (`function(NLCSTNode)`).
// Every time one of these methods are called, the plugin is invoked with the
// node, allowing for easy modification.
//
// In fact, the internal transformation from `tokenize` (a list of words, white
// space, punctuation, and symbols) to `tokenizeRoot` (an NLCST tree), is also
// implemented through this mechanism.

// Create a `WordNode` with its children set to a single `TextNode`, its value
// set to the given `value`.
pluggable(ParseLatin, 'tokenizeWord', function (value, eat) {
  const add = (eat || noopEat)('')
  const parent = {type: 'WordNode', children: []}

  this.tokenizeText(value, eat, parent)

  return add(parent)
})

// Create a `SentenceNode` with its children set to `Node`s, their values set
// to the tokenized given `value`.
//
// Unless plugins add new nodes, the sentence is populated by `WordNode`s,
// `SymbolNode`s, `PunctuationNode`s, and `WhiteSpaceNode`s.
pluggable(
  ParseLatin,
  'tokenizeSentence',
  parserFactory({type: 'SentenceNode', tokenizer: 'tokenize'})
)

// Create a `ParagraphNode` with its children set to `Node`s, their values set
// to the tokenized given `value`.
//
// Unless plugins add new nodes, the paragraph is populated by `SentenceNode`s
// and `WhiteSpaceNode`s.
pluggable(
  ParseLatin,
  'tokenizeParagraph',
  parserFactory({
    type: 'ParagraphNode',
    delimiter: terminalMarker,
    delimiterType: 'PunctuationNode',
    tokenizer: 'tokenizeSentence'
  })
)

// Create a `RootNode` with its children set to `Node`s, their values set to the
// tokenized given `value`.
pluggable(
  ParseLatin,
  'tokenizeRoot',
  parserFactory({
    type: 'RootNode',
    delimiter: newLine,
    delimiterType: 'WhiteSpaceNode',
    tokenizer: 'tokenizeParagraph'
  })
)

// PLUGINS

ParseLatin.prototype.use('tokenizeSentence', [
  mergeInitialWordSymbol,
  mergeFinalWordSymbol,
  mergeInnerWordSymbol,
  mergeInnerWordSlash,
  mergeInitialisms,
  mergeWords,
  patchPosition
])

ParseLatin.prototype.use('tokenizeParagraph', [
  mergeNonWordSentences,
  mergeAffixSymbol,
  mergeInitialLowerCaseLetterSentences,
  mergeInitialDigitSentences,
  mergePrefixExceptions,
  mergeAffixExceptions,
  mergeRemainingFullStops,
  makeInitialWhiteSpaceSiblings,
  makeFinalWhiteSpaceSiblings,
  breakImplicitSentences,
  removeEmptyNodes,
  patchPosition
])

ParseLatin.prototype.use('tokenizeRoot', [
  makeInitialWhiteSpaceSiblings,
  makeFinalWhiteSpaceSiblings,
  removeEmptyNodes,
  patchPosition
])

// TEXT NODES

// Factory to create a `Text`.
function createTextFactory(type) {
  type += 'Node'

  return createText

  // Construct a `Text` from a bound `type`
  function createText(value, eat, parent) {
    if (value === null || value === undefined) {
      value = ''
    }

    return (eat || noopEat)(value)({type, value: String(value)}, parent)
  }
}

// Make a method “pluggable”.
function pluggable(Constructor, key, callback) {
  // Set a pluggable version of `callback` on `Constructor`.
  Constructor.prototype[key] = function (...input) {
    return this.run(key, callback.apply(this, input))
  }
}

// Factory to inject `plugins`. Takes `callback` for the actual inserting.
function useFactory(callback) {
  return use

  // Validate if `plugins` can be inserted.
  // Invokes the bound `callback` to do the actual inserting.
  function use(key, plugins) {
    // Throw if the method is not pluggable.
    if (!(key in this)) {
      throw new Error(
        'Illegal Invocation: Unsupported `key` for ' +
          '`use(key, plugins)`. Make sure `key` is a ' +
          'supported function'
      )
    }

    // Fail silently when no plugins are given.
    if (!plugins) {
      return
    }

    const wareKey = key + 'Plugins'

    // Make sure `plugins` is a list.
    plugins = typeof plugins === 'function' ? [plugins] : plugins.concat()

    // Make sure `wareKey` exists.
    if (!this[wareKey]) {
      this[wareKey] = []
    }

    // Invoke callback with the ware key and plugins.
    callback(this, wareKey, plugins)
  }
}

// Add mechanism used when text-tokenisers are called directly outside of the
// `tokenize` function.
function noopAdd(node, parent) {
  if (parent) {
    parent.children.push(node)
  }

  return node
}

// Eat and add mechanism without adding positional information, used when
// text-tokenisers are called directly outside of the `tokenize` function.
function noopEat() {
  return noopAdd
}
