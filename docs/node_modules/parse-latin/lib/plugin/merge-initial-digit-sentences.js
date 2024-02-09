import {toString} from 'nlcst-to-string'
import {modifyChildren} from 'unist-util-modify-children'
import {digitStart} from '../expressions.js'

// Merge a sentence into its previous sentence, when the sentence starts with a
// lower case letter.
export const mergeInitialDigitSentences = modifyChildren(function (
  child,
  index,
  parent
) {
  const children = child.children
  const siblings = parent.children
  const previous = siblings[index - 1]
  const head = children[0]

  if (
    previous &&
    head &&
    head.type === 'WordNode' &&
    digitStart.test(toString(head))
  ) {
    previous.children = previous.children.concat(children)
    siblings.splice(index, 1)

    // Update position.
    if (previous.position && child.position) {
      previous.position.end = child.position.end
    }

    // Next, iterate over the node *now* at the current position.
    return index
  }
})
