/**
 * Compile MDX to JS.
 *
 * @param {VFileCompatible} vfileCompatible
 *   MDX document to parse (`string`, `Buffer`, `vfile`, anything that can be
 *   given to `vfile`).
 * @param {CompileOptions | null | undefined} [compileOptions]
 *   Compile configuration.
 * @return {Promise<VFile>}
 *   File.
 */
export function compile(vfileCompatible: VFileCompatible, compileOptions?: CompileOptions | null | undefined): Promise<VFile>;
/**
 * Synchronously compile MDX to JS.
 *
 * @param {VFileCompatible} vfileCompatible
 *   MDX document to parse (`string`, `Buffer`, `vfile`, anything that can be
 *   given to `vfile`).
 * @param {CompileOptions | null | undefined} [compileOptions]
 *   Compile configuration.
 * @return {VFile}
 *   File.
 */
export function compileSync(vfileCompatible: VFileCompatible, compileOptions?: CompileOptions | null | undefined): VFile;
export type VFile = import('vfile').VFile;
export type VFileCompatible = import('vfile').VFileCompatible;
export type PluginOptions = import('./core.js').PluginOptions;
export type BaseProcessorOptions = import('./core.js').BaseProcessorOptions;
/**
 * Core configuration.
 */
export type CoreProcessorOptions = Omit<BaseProcessorOptions, 'format'>;
/**
 * Extra configuration.
 */
export type ExtraOptions = {
    /**
     * Format of `file`.
     */
    format?: 'detect' | 'mdx' | 'md' | null | undefined;
};
/**
 * Configuration.
 */
export type CompileOptions = CoreProcessorOptions & PluginOptions & ExtraOptions;
