// @ts-nocheck
hsts.displayName = 'hsts'
hsts.aliases = []

/** @type {import('../core.js').Syntax} */
export default function hsts(Prism) {
  /**
   * Original by Scott Helme.
   *
   * Reference: https://scotthelme.co.uk/hsts-cheat-sheet/
   */

  Prism.languages.hsts = {
    directive: {
      pattern: /\b(?:includeSubDomains|max-age|preload)(?=[\s;=]|$)/i,
      alias: 'property'
    },
    operator: /=/,
    punctuation: /;/
  }
}
