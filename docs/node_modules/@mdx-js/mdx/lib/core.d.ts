/**
 * Pipeline to:
 *
 * 1. Parse MDX (serialized markdown with embedded JSX, ESM, and  expressions)
 * 2. Transform through remark (mdast), rehype (hast), and recma (esast)
 * 3. Serialize as JavaScript
 *
 * @param {ProcessorOptions | null | undefined} [options]
 *   Configuration.
 * @return {Processor}
 *   Processor.
 */
export function createProcessor(options?: ProcessorOptions | null | undefined): Processor;
export type RemarkRehypeOptions = import('remark-rehype').Options;
export type PluggableList = import('unified').PluggableList;
export type Processor = import('unified').Processor;
export type RehypeRecmaOptions = import('./plugin/rehype-recma.js').Options;
export type RecmaDocumentOptions = import('./plugin/recma-document.js').RecmaDocumentOptions;
export type RecmaStringifyOptions = import('./plugin/recma-stringify.js').RecmaStringifyOptions;
export type RecmaJsxRewriteOptions = import('./plugin/recma-jsx-rewrite.js').RecmaJsxRewriteOptions;
/**
 * Base configuration.
 */
export type BaseProcessorOptions = {
    /**
     * Whether to keep JSX.
     */
    jsx?: boolean | null | undefined;
    /**
     * Format of the files to be processed.
     */
    format?: 'mdx' | 'md' | null | undefined;
    /**
     * Whether to compile to a whole program or a function body..
     */
    outputFormat?: "function-body" | "program" | undefined;
    /**
     * Extensions (with `.`) for markdown.
     */
    mdExtensions?: Array<string> | null | undefined;
    /**
     * Extensions (with `.`) for MDX.
     */
    mdxExtensions?: Array<string> | null | undefined;
    /**
     * List of recma (esast, JavaScript) plugins.
     */
    recmaPlugins?: import("unified").PluggableList | null | undefined;
    /**
     * List of remark (mdast, markdown) plugins.
     */
    remarkPlugins?: import("unified").PluggableList | null | undefined;
    /**
     * List of rehype (hast, HTML) plugins.
     */
    rehypePlugins?: import("unified").PluggableList | null | undefined;
    /**
     * Options to pass through to `remark-rehype`.
     */
    remarkRehypeOptions?: RemarkRehypeOptions | null | undefined;
};
/**
 * Configuration for internal plugins.
 */
export type PluginOptions = Omit<RehypeRecmaOptions & RecmaDocumentOptions & RecmaStringifyOptions & RecmaJsxRewriteOptions, 'outputFormat'>;
/**
 * Configuration for processor.
 */
export type ProcessorOptions = BaseProcessorOptions & PluginOptions;
