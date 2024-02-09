// @ts-nocheck
import refractorJavadoclike from './javadoclike.js'
import refractorPhp from './php.js'
phpdoc.displayName = 'phpdoc'
phpdoc.aliases = []

/** @type {import('../core.js').Syntax} */
export default function phpdoc(Prism) {
  Prism.register(refractorJavadoclike)
  Prism.register(refractorPhp)
  ;(function (Prism) {
    var typeExpression = /(?:\b[a-zA-Z]\w*|[|\\[\]])+/.source
    Prism.languages.phpdoc = Prism.languages.extend('javadoclike', {
      parameter: {
        pattern: RegExp(
          '(@(?:global|param|property(?:-read|-write)?|var)\\s+(?:' +
            typeExpression +
            '\\s+)?)\\$\\w+'
        ),
        lookbehind: true
      }
    })
    Prism.languages.insertBefore('phpdoc', 'keyword', {
      'class-name': [
        {
          pattern: RegExp(
            '(@(?:global|package|param|property(?:-read|-write)?|return|subpackage|throws|var)\\s+)' +
              typeExpression
          ),
          lookbehind: true,
          inside: {
            keyword:
              /\b(?:array|bool|boolean|callback|double|false|float|int|integer|mixed|null|object|resource|self|string|true|void)\b/,
            punctuation: /[|\\[\]()]/
          }
        }
      ]
    })
    Prism.languages.javadoclike.addSupport('php', Prism.languages.phpdoc)
  })(Prism)
}
