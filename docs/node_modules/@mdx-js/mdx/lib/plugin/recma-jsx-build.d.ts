export function recmaJsxBuild(this: import("unified").Processor<void, import("estree").Program, void, void>, ...settings: [RecmaJsxBuildOptions | null | undefined] | []): void | import("unified").Transformer<import("estree").Program, import("estree").Program>;
export type Program = import('estree-jsx').Program;
export type BuildJsxOptions = import('estree-util-build-jsx').BuildJsxOptions;
/**
 * Configuration for internal plugin `recma-jsx-build`.
 */
export type ExtraOptions = {
    /**
     * Whether to keep the import of the automatic runtime or get it from
     * `arguments[0]` instead.
     */
    outputFormat?: 'function-body' | 'program' | null | undefined;
};
export type RecmaJsxBuildOptions = BuildJsxOptions & ExtraOptions;
