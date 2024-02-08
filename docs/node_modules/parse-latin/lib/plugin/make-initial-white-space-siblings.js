import {visitChildren} from 'unist-util-visit-children'

// Move white space starting a sentence up, so they are the siblings of
// sentences.
export const makeInitialWhiteSpaceSiblings = visitChildren(function (
  child,
  index,
  parent
) {
  const children = child.children
  if (
    children &&
    children.length > 0 &&
    children[0].type === 'WhiteSpaceNode'
  ) {
    parent.children.splice(index, 0, children.shift())
    const next = children[0]

    if (next && next.position && child.position) {
      child.position.start = next.position.start
    }
  }
})
