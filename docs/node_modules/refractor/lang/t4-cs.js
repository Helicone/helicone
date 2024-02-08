// @ts-nocheck
import refractorCsharp from './csharp.js'
import refractorT4Templating from './t4-templating.js'
t4Cs.displayName = 't4-cs'
t4Cs.aliases = ['t4']

/** @type {import('../core.js').Syntax} */
export default function t4Cs(Prism) {
  Prism.register(refractorCsharp)
  Prism.register(refractorT4Templating)
  Prism.languages.t4 = Prism.languages['t4-cs'] =
    Prism.languages['t4-templating'].createT4('csharp')
}
