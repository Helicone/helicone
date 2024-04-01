export interface NodePolyfillsOptions {
    fs?: boolean;
    crypto?: boolean;
    sourceMap?: boolean;
    baseDir?: string;
    include?: Array<string | RegExp> | string | RegExp | null;
    exclude?: Array<string | RegExp> | string | RegExp | null;
}
export declare function builtinsResolver(opts: NodePolyfillsOptions): (importee: string) => {
    id: any;
    moduleSideEffects: boolean;
} | null;
