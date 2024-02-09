import {toString} from 'nlcst-to-string'
import {modifyChildren} from 'unist-util-modify-children'

// Initial lowercase letter.
import {lowerInitial} from '../expressions.js'

// Merge a sentence into its previous sentence, when the sentence starts with a
// lower case letter.
export const mergeInitialLowerCaseLetterSentences = modifyChildren(function (
  child,
  index,
  parent
) {
  const children = child.children

  if (children && children.length > 0 && index > 0) {
    let position = -1

    while (children[++position]) {
      const node = children[position]

      if (node.type === 'WordNode') {
        if (!lowerInitial.test(toString(node))) {
          return
        }

        const siblings = parent.children
        const previous = siblings[index - 1]

        previous.children = previous.children.concat(children)

        siblings.splice(index, 1)

        // Update position.
        if (previous.position && child.position) {
          previous.position.end = child.position.end
        }

        // Next, iterate over the node *now* at the current position.
        return index
      }

      if (node.type === 'SymbolNode' || node.type === 'PunctuationNode') {
        return
      }
    }
  }
})
