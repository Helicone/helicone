import {toString} from 'nlcst-to-string'
import {modifyChildren} from 'unist-util-modify-children'
import {numerical} from '../expressions.js'

// Merge initialisms.
export const mergeInitialisms = modifyChildren(function (child, index, parent) {
  if (index > 0 && toString(child) === '.') {
    const siblings = parent.children

    const previous = siblings[index - 1]
    const children = previous.children

    if (
      previous.type === 'WordNode' &&
      children &&
      children.length !== 1 &&
      children.length % 2 !== 0
    ) {
      let position = children.length
      let isAllDigits = true

      while (children[--position]) {
        const otherChild = children[position]

        const value = toString(otherChild)

        if (position % 2 === 0) {
          // Initialisms consist of one character values.
          if (value.length > 1) {
            return
          }

          if (!numerical.test(value)) {
            isAllDigits = false
          }
        } else if (value !== '.') {
          if (position < children.length - 2) {
            break
          } else {
            return
          }
        }
      }

      if (!isAllDigits) {
        // Remove `child` from parent.
        siblings.splice(index, 1)

        // Add child to the previous children.
        children.push(child)

        // Update position.
        if (previous.position && child.position) {
          previous.position.end = child.position.end
        }

        // Next, iterate over the node *now* at the current position.
        return index
      }
    }
  }
})
