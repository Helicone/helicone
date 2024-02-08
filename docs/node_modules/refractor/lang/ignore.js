// @ts-nocheck
ignore.displayName = 'ignore'
ignore.aliases = ['gitignore', 'hgignore', 'npmignore']

/** @type {import('../core.js').Syntax} */
export default function ignore(Prism) {
  ;(function (Prism) {
    Prism.languages.ignore = {
      // https://git-scm.com/docs/gitignore
      comment: /^#.*/m,
      entry: {
        pattern: /\S(?:.*(?:(?:\\ )|\S))?/,
        alias: 'string',
        inside: {
          operator: /^!|\*\*?|\?/,
          regex: {
            pattern: /(^|[^\\])\[[^\[\]]*\]/,
            lookbehind: true
          },
          punctuation: /\//
        }
      }
    }
    Prism.languages.gitignore = Prism.languages.ignore
    Prism.languages.hgignore = Prism.languages.ignore
    Prism.languages.npmignore = Prism.languages.ignore
  })(Prism)
}
