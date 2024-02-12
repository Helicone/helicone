// @ts-nocheck
import refractorMarkupTemplating from './markup-templating.js'
import refractorRuby from './ruby.js'
erb.displayName = 'erb'
erb.aliases = []

/** @type {import('../core.js').Syntax} */
export default function erb(Prism) {
  Prism.register(refractorMarkupTemplating)
  Prism.register(refractorRuby)
  ;(function (Prism) {
    Prism.languages.erb = {
      delimiter: {
        pattern: /^(\s*)<%=?|%>(?=\s*$)/,
        lookbehind: true,
        alias: 'punctuation'
      },
      ruby: {
        pattern: /\s*\S[\s\S]*/,
        alias: 'language-ruby',
        inside: Prism.languages.ruby
      }
    }
    Prism.hooks.add('before-tokenize', function (env) {
      var erbPattern =
        /<%=?(?:[^\r\n]|[\r\n](?!=begin)|[\r\n]=begin\s(?:[^\r\n]|[\r\n](?!=end))*[\r\n]=end)+?%>/g
      Prism.languages['markup-templating'].buildPlaceholders(
        env,
        'erb',
        erbPattern
      )
    })
    Prism.hooks.add('after-tokenize', function (env) {
      Prism.languages['markup-templating'].tokenizePlaceholders(env, 'erb')
    })
  })(Prism)
}
