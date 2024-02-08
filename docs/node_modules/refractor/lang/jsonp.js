// @ts-nocheck
import refractorJson from './json.js'
jsonp.displayName = 'jsonp'
jsonp.aliases = []

/** @type {import('../core.js').Syntax} */
export default function jsonp(Prism) {
  Prism.register(refractorJson)
  Prism.languages.jsonp = Prism.languages.extend('json', {
    punctuation: /[{}[\]();,.]/
  })
  Prism.languages.insertBefore('jsonp', 'punctuation', {
    function: /(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*\()/
  })
}
