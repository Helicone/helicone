import {modifyChildren} from 'unist-util-modify-children'

// Merge a sentence into the following sentence, when the sentence does not
// contain word tokens.
export const mergeNonWordSentences = modifyChildren(function (
  child,
  index,
  parent
) {
  const children = child.children
  let position = -1

  while (children[++position]) {
    if (children[position].type === 'WordNode') {
      return
    }
  }

  const previous = parent.children[index - 1]

  if (previous) {
    previous.children = previous.children.concat(children)

    // Remove the child.
    parent.children.splice(index, 1)

    // Patch position.
    if (previous.position && child.position) {
      previous.position.end = child.position.end
    }

    // Next, iterate over the node *now* at the current position (which was the
    // next node).
    return index
  }

  const next = parent.children[index + 1]

  if (next) {
    next.children = children.concat(next.children)

    // Patch position.
    if (next.position && child.position) {
      next.position.start = child.position.start
    }

    // Remove the child.
    parent.children.splice(index, 1)
  }
})
