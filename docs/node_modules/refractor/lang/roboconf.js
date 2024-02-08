// @ts-nocheck
roboconf.displayName = 'roboconf'
roboconf.aliases = []

/** @type {import('../core.js').Syntax} */
export default function roboconf(Prism) {
  Prism.languages.roboconf = {
    comment: /#.*/,
    keyword: {
      pattern:
        /(^|\s)(?:(?:external|import)\b|(?:facet|instance of)(?=[ \t]+[\w-]+[ \t]*\{))/,
      lookbehind: true
    },
    component: {
      pattern: /[\w-]+(?=[ \t]*\{)/,
      alias: 'variable'
    },
    property: /[\w.-]+(?=[ \t]*:)/,
    value: {
      pattern: /(=[ \t]*(?![ \t]))[^,;]+/,
      lookbehind: true,
      alias: 'attr-value'
    },
    optional: {
      pattern: /\(optional\)/,
      alias: 'builtin'
    },
    wildcard: {
      pattern: /(\.)\*/,
      lookbehind: true,
      alias: 'operator'
    },
    punctuation: /[{},.;:=]/
  }
}
