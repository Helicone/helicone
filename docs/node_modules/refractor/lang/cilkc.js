// @ts-nocheck
import refractorC from './c.js'
cilkc.displayName = 'cilkc'
cilkc.aliases = ['cilk-c']

/** @type {import('../core.js').Syntax} */
export default function cilkc(Prism) {
  Prism.register(refractorC)
  Prism.languages.cilkc = Prism.languages.insertBefore('c', 'function', {
    'parallel-keyword': {
      pattern: /\bcilk_(?:for|reducer|s(?:cope|pawn|ync))\b/,
      alias: 'keyword'
    }
  })
  Prism.languages['cilk-c'] = Prism.languages['cilkc']
}
