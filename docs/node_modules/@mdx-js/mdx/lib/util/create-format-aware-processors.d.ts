/**
 * Create smart processors to handle different formats.
 *
 * @param {CompileOptions | null | undefined} [compileOptions]
 *   configuration.
 * @return {{extnames: Array<string>, process: process, processSync: processSync}}
 *   Smart processor.
 */
export function createFormatAwareProcessors(compileOptions?: CompileOptions | null | undefined): {
    extnames: Array<string>;
    process: (vfileCompatible: VFileCompatible) => Promise<VFile>;
    processSync: (vfileCompatible: VFileCompatible) => VFile;
};
export type Processor = import('unified').Processor;
export type VFile = import('vfile').VFile;
export type VFileCompatible = import('vfile').VFileCompatible;
export type CompileOptions = import('../compile.js').CompileOptions;
