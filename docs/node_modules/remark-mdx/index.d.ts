export default function remarkMdx(this: import("unified").Processor<void, import("mdast").Root, void, void>, ...settings: [Options | null | undefined] | []): void | import("unified").Transformer<import("mdast").Root, import("mdast").Root>;
export type Root = import('mdast').Root;
export type MicromarkOptions = import('micromark-extension-mdxjs').Options;
export type ToMarkdownOptions = import('mdast-util-mdx').ToMarkdownOptions;
export type DoNotTouchAsThisIncludesMdxInTree = typeof import("mdast-util-mdx");
/**
 * Configuration.
 */
export type Options = MicromarkOptions & ToMarkdownOptions;
