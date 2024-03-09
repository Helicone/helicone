import {toString} from 'nlcst-to-string'

// Factory to create a tokenizer based on a given `expression`.
export function tokenizerFactory(childType, expression) {
  return tokenizer

  // A function that splits.
  function tokenizer(node) {
    const children = []
    const tokens = node.children
    const type = node.type
    let index = -1
    const lastIndex = tokens.length - 1
    let start = 0

    while (++index < tokens.length) {
      if (
        index === lastIndex ||
        (tokens[index].type === childType &&
          expression.test(toString(tokens[index])))
      ) {
        const first = tokens[start]
        const last = tokens[index]

        const parent = {type, children: tokens.slice(start, index + 1)}

        if (first.position && last.position) {
          parent.position = {
            start: first.position.start,
            end: last.position.end
          }
        }

        children.push(parent)

        start = index + 1
      }
    }

    return children
  }
}
