// @ts-nocheck
hpkp.displayName = 'hpkp'
hpkp.aliases = []

/** @type {import('../core.js').Syntax} */
export default function hpkp(Prism) {
  /**
   * Original by Scott Helme.
   *
   * Reference: https://scotthelme.co.uk/hpkp-cheat-sheet/
   */

  Prism.languages.hpkp = {
    directive: {
      pattern:
        /\b(?:includeSubDomains|max-age|pin-sha256|preload|report-to|report-uri|strict)(?=[\s;=]|$)/i,
      alias: 'property'
    },
    operator: /=/,
    punctuation: /;/
  }
}
