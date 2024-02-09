import {toString} from 'nlcst-to-string'
import {modifyChildren} from 'unist-util-modify-children'

// Merge certain punctuation marks into their preceding words.
export const mergeFinalWordSymbol = modifyChildren(function (
  child,
  index,
  parent
) {
  if (
    index > 0 &&
    (child.type === 'SymbolNode' || child.type === 'PunctuationNode') &&
    toString(child) === '-'
  ) {
    const children = parent.children
    const previous = children[index - 1]
    const next = children[index + 1]

    if (
      (!next || next.type !== 'WordNode') &&
      previous &&
      previous.type === 'WordNode'
    ) {
      // Remove `child` from parent.
      children.splice(index, 1)

      // Add the punctuation mark at the end of the previous node.
      previous.children.push(child)

      // Update position.
      if (previous.position && child.position) {
        previous.position.end = child.position.end
      }

      // Next, iterate over the node *now* at the current position (which was
      // the next node).
      return index
    }
  }
})
