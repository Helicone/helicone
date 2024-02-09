// @ts-nocheck
import refractorT4Templating from './t4-templating.js'
import refractorVbnet from './vbnet.js'
t4Vb.displayName = 't4-vb'
t4Vb.aliases = []

/** @type {import('../core.js').Syntax} */
export default function t4Vb(Prism) {
  Prism.register(refractorT4Templating)
  Prism.register(refractorVbnet)
  Prism.languages['t4-vb'] = Prism.languages['t4-templating'].createT4('vbnet')
}
