/**
 * @typedef {import('micromark-util-types').Extension} Extension
 */

// To do: next major: expose functions.

/**
 * Extension for `micromark` that can be passed in `extensions` to disable
 * some CommonMark syntax (code (indented), autolinks, and HTML (flow and
 * text)) for MDX.
 *
 * @type {Extension}
 */
export const mdxMd = {
  disable: {null: ['autolink', 'codeIndented', 'htmlFlow', 'htmlText']}
}
