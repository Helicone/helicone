import {modifyChildren} from 'unist-util-modify-children'

// Merge multiple words. This merges the children of adjacent words, something
// which should not occur naturally by parse-latin, but might happen when custom
// tokens were passed in.
export const mergeWords = modifyChildren(function (child, index, parent) {
  const siblings = parent.children

  if (child.type === 'WordNode') {
    const next = siblings[index + 1]

    if (next && next.type === 'WordNode') {
      // Remove `next` from parent.
      siblings.splice(index + 1, 1)

      // Add the punctuation mark at the end of the previous node.
      child.children = child.children.concat(next.children)

      // Update position.
      if (next.position && child.position) {
        child.position.end = next.position.end
      }

      // Next, re-iterate the current node.
      return index
    }
  }
})
