/**
 * Create a file and options from a given `vfileCompatible` and options that
 * might contain `format: 'detect'`.
 *
 * @param {VFileCompatible} vfileCompatible
 * @param {CompileOptions | null | undefined} [options]
 * @returns {{file: VFile, options: ProcessorOptions}}
 */
export function resolveFileAndOptions(vfileCompatible: VFileCompatible, options?: CompileOptions | null | undefined): {
    file: VFile;
    options: ProcessorOptions;
};
export type VFileCompatible = import('vfile').VFileCompatible;
export type ProcessorOptions = import('../core.js').ProcessorOptions;
export type CompileOptions = import('../compile.js').CompileOptions;
import { VFile } from "vfile";
