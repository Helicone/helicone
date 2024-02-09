import {modifyChildren} from 'unist-util-modify-children'

// Remove empty children.
export const removeEmptyNodes = modifyChildren(function (child, index, parent) {
  if ('children' in child && child.children.length === 0) {
    parent.children.splice(index, 1)

    // Next, iterate over the node *now* at the current position (which was the
    // next node).
    return index
  }
})
