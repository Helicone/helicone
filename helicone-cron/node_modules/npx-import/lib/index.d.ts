declare type Logger = (message: string) => void;
export declare function npxImport<T = unknown>(pkg: string | string[], logger?: Logger): Promise<T>;
export declare function npxResolve(pkg: string): string;
declare const INSTRUCTIONS: {
    npm: (packageName: string) => string;
    pnpm: (packageName: string) => string;
    yarn: (packageName: string) => string;
};
export declare function getPackageManager(): keyof typeof INSTRUCTIONS;
export {};
