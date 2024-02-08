import {toString} from 'nlcst-to-string'
import {modifyChildren} from 'unist-util-modify-children'

// Break a sentence if a white space with more than one new-line is found.
export const breakImplicitSentences = modifyChildren(function (
  child,
  index,
  parent
) {
  if (child.type !== 'SentenceNode') {
    return
  }

  const children = child.children

  // Ignore first and last child.
  let position = 0

  while (++position < children.length - 1) {
    const node = children[position]

    if (
      node.type !== 'WhiteSpaceNode' ||
      toString(node).split(/\r\n|\r|\n/).length < 3
    ) {
      continue
    }

    child.children = children.slice(0, position)

    const insertion = {
      type: 'SentenceNode',
      children: children.slice(position + 1)
    }

    const tail = children[position - 1]
    const head = children[position + 1]

    parent.children.splice(index + 1, 0, node, insertion)

    if (child.position && tail.position && head.position) {
      const end = child.position.end

      child.position.end = tail.position.end

      insertion.position = {start: head.position.start, end}
    }

    return index + 1
  }
})
