export function recmaStringify(this: import("unified").Processor<void, import("estree").Program, import("estree").Program, string>, ...settings: [] | [RecmaStringifyOptions | null | undefined]): void;
export type Program = import('estree-jsx').Program;
export type SourceMapGenerator = typeof import('source-map').SourceMapGenerator;
/**
 * Configuration for internal plugin `recma-stringify`.
 */
export type RecmaStringifyOptions = {
    /**
     * Generate a source map by passing a `SourceMapGenerator` from `source-map`
     * in.
     */
    SourceMapGenerator?: SourceMapGenerator | null | undefined;
};
