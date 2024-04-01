import { NodePolyfillsOptions } from './modules';
export default function (opts?: NodePolyfillsOptions): {
    name: string;
    resolveId(importee: string, importer: string): {
        id: any;
        moduleSideEffects: boolean;
    } | null;
    load(id: string): string | undefined;
    transform(code: string, id: string): any;
};
