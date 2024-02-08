import {toString} from 'nlcst-to-string'
import {modifyChildren} from 'unist-util-modify-children'

// Merge a sentence into its previous sentence, when the sentence starts with a
// comma.
export const mergeAffixExceptions = modifyChildren(function (
  child,
  index,
  parent
) {
  const children = child.children

  if (!children || children.length === 0 || index < 1) {
    return
  }

  let position = -1

  while (children[++position]) {
    const node = children[position]

    if (node.type === 'WordNode') {
      return
    }

    if (node.type === 'SymbolNode' || node.type === 'PunctuationNode') {
      const value = toString(node)

      if (value !== ',' && value !== ';') {
        return
      }

      const previousChild = parent.children[index - 1]
      previousChild.children = previousChild.children.concat(children)

      // Update position.
      if (previousChild.position && child.position) {
        previousChild.position.end = child.position.end
      }

      parent.children.splice(index, 1)

      // Next, iterate over the node *now* at the current position.
      return index
    }
  }
})
