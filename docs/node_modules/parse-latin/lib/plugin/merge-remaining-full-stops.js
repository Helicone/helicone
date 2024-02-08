import {toString} from 'nlcst-to-string'
import {visitChildren} from 'unist-util-visit-children'

// Full stop characters that should not be treated as terminal sentence markers:
// A case-insensitive abbreviation.
import {terminalMarker} from '../expressions.js'

// Merge non-terminal-marker full stops into the previous word (if available),
// or the next word (if available).
export const mergeRemainingFullStops = visitChildren(function (child) {
  const children = child.children
  let position = children.length
  let hasFoundDelimiter = false

  while (children[--position]) {
    const grandchild = children[position]

    if (
      grandchild.type !== 'SymbolNode' &&
      grandchild.type !== 'PunctuationNode'
    ) {
      // This is a sentence without terminal marker, so we 'fool' the code to
      // make it think we have found one.
      if (grandchild.type === 'WordNode') {
        hasFoundDelimiter = true
      }

      continue
    }

    // Exit when this token is not a terminal marker.
    if (!terminalMarker.test(toString(grandchild))) {
      continue
    }

    // Ignore the first terminal marker found (starting at the end), as it
    // should not be merged.
    if (!hasFoundDelimiter) {
      hasFoundDelimiter = true

      continue
    }

    // Only merge a single full stop.
    if (toString(grandchild) !== '.') {
      continue
    }

    const previous = children[position - 1]
    const next = children[position + 1]

    if (previous && previous.type === 'WordNode') {
      const nextNext = children[position + 2]

      // Continue when the full stop is followed by a space and another full
      // stop, such as: `{.} .`
      if (
        next &&
        nextNext &&
        next.type === 'WhiteSpaceNode' &&
        toString(nextNext) === '.'
      ) {
        continue
      }

      // Remove `child` from parent.
      children.splice(position, 1)

      // Add the punctuation mark at the end of the previous node.
      previous.children.push(grandchild)

      // Update position.
      if (grandchild.position && previous.position) {
        previous.position.end = grandchild.position.end
      }

      position--
    } else if (next && next.type === 'WordNode') {
      // Remove `child` from parent.
      children.splice(position, 1)

      // Add the punctuation mark at the start of the next node.
      next.children.unshift(grandchild)

      if (grandchild.position && next.position) {
        next.position.start = grandchild.position.start
      }
    }
  }
})
