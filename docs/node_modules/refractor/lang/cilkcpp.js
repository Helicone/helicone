// @ts-nocheck
import refractorCpp from './cpp.js'
cilkcpp.displayName = 'cilkcpp'
cilkcpp.aliases = ['cilk', 'cilk-cpp']

/** @type {import('../core.js').Syntax} */
export default function cilkcpp(Prism) {
  Prism.register(refractorCpp)
  Prism.languages.cilkcpp = Prism.languages.insertBefore('cpp', 'function', {
    'parallel-keyword': {
      pattern: /\bcilk_(?:for|reducer|s(?:cope|pawn|ync))\b/,
      alias: 'keyword'
    }
  })
  Prism.languages['cilk-cpp'] = Prism.languages['cilkcpp']
  Prism.languages['cilk'] = Prism.languages['cilkcpp']
}
