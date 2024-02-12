import {modifyChildren} from 'unist-util-modify-children'

// Move white space ending a paragraph up, so they are the siblings of
// paragraphs.
export const makeFinalWhiteSpaceSiblings = modifyChildren(function (
  child,
  index,
  parent
) {
  const children = child.children

  if (
    children &&
    children.length > 0 &&
    children[children.length - 1].type === 'WhiteSpaceNode'
  ) {
    parent.children.splice(index + 1, 0, child.children.pop())
    const previous = children[children.length - 1]

    if (previous && previous.position && child.position) {
      child.position.end = previous.position.end
    }

    // Next, iterate over the current node again.
    return index
  }
})
