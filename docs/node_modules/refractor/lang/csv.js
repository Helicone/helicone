// @ts-nocheck
csv.displayName = 'csv'
csv.aliases = []

/** @type {import('../core.js').Syntax} */
export default function csv(Prism) {
  // https://tools.ietf.org/html/rfc4180

  Prism.languages.csv = {
    value: /[^\r\n,"]+|"(?:[^"]|"")*"(?!")/,
    punctuation: /,/
  }
}
