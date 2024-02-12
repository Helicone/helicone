import {toString} from 'nlcst-to-string'
import {modifyChildren} from 'unist-util-modify-children'

const slash = '/'

// Merge words joined by certain punctuation marks.
export const mergeInnerWordSlash = modifyChildren(function (
  child,
  index,
  parent
) {
  const siblings = parent.children
  const previous = siblings[index - 1]
  const next = siblings[index + 1]

  if (
    previous &&
    previous.type === 'WordNode' &&
    (child.type === 'SymbolNode' || child.type === 'PunctuationNode') &&
    toString(child) === slash
  ) {
    const previousValue = toString(previous)
    let tail = child
    let queue = [child]
    let count = 1
    let nextValue = ''

    if (next && next.type === 'WordNode') {
      nextValue = toString(next)
      tail = next
      queue = queue.concat(next.children)
      count++
    }

    if (previousValue.length < 3 && (!nextValue || nextValue.length < 3)) {
      // Add all found tokens to `prev`s children.
      previous.children = previous.children.concat(queue)

      siblings.splice(index, count)

      // Update position.
      if (previous.position && tail.position) {
        previous.position.end = tail.position.end
      }

      // Next, iterate over the node *now* at the current position.
      return index
    }
  }
})
