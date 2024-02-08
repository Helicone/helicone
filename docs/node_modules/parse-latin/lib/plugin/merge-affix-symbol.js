import {toString} from 'nlcst-to-string'
import {modifyChildren} from 'unist-util-modify-children'

// Closing or final punctuation, or terminal markers that should still be
// included in the previous sentence, even though they follow the sentence’s
// terminal marker.
import {affixSymbol} from '../expressions.js'

// Move certain punctuation following a terminal marker (thus in the next
// sentence) to the previous sentence.
export const mergeAffixSymbol = modifyChildren(function (child, index, parent) {
  const children = child.children

  if (children && children.length > 0 && index > 0) {
    const first = children[0]
    const second = children[1]
    const previous = parent.children[index - 1]

    if (
      (first.type === 'SymbolNode' || first.type === 'PunctuationNode') &&
      affixSymbol.test(toString(first))
    ) {
      previous.children.push(children.shift())

      // Update position.
      if (first.position && previous.position) {
        previous.position.end = first.position.end
      }

      if (second && second.position && child.position) {
        child.position.start = second.position.start
      }

      // Next, iterate over the previous node again.
      return index - 1
    }
  }
})
