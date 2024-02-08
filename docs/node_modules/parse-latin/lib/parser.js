import {tokenizerFactory} from './tokenizer.js'

// Construct a parser based on `options`.
export function parserFactory(options) {
  const type = options.type
  const tokenizerProperty = options.tokenizer
  const delimiter = options.delimiter
  const tokenize =
    delimiter && tokenizerFactory(options.delimiterType, delimiter)

  return parser

  function parser(value) {
    const children = this[tokenizerProperty](value)

    return {type, children: tokenize ? tokenize(children) : children}
  }
}
