/**
 * Plugin to add support for frontmatter.
 *
 * @type {import('unified').Plugin<[Options?]|void[], Root>}
 */
export default function remarkFrontmatter(
  options?:
    | void
    | import('micromark-extension-frontmatter/matters').Options
    | undefined
):
  | void
  | import('unified').Transformer<import('mdast').Root, import('mdast').Root>
export type Root = import('mdast').Root
export type Options = import('micromark-extension-frontmatter').Options
