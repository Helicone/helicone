/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('micromark-extension-frontmatter').Options} Options
 */

import {frontmatter} from 'micromark-extension-frontmatter'
import {
  frontmatterFromMarkdown,
  frontmatterToMarkdown
} from 'mdast-util-frontmatter'

/**
 * Plugin to add support for frontmatter.
 *
 * @type {import('unified').Plugin<[Options?]|void[], Root>}
 */
export default function remarkFrontmatter(options = 'yaml') {
  const data = this.data()

  add('micromarkExtensions', frontmatter(options))
  add('fromMarkdownExtensions', frontmatterFromMarkdown(options))
  add('toMarkdownExtensions', frontmatterToMarkdown(options))

  /**
   * @param {string} field
   * @param {unknown} value
   */
  function add(field, value) {
    const list = /** @type {unknown[]} */ (
      // Other extensions
      /* c8 ignore next 2 */
      data[field] ? data[field] : (data[field] = [])
    )

    list.push(value)
  }
}
