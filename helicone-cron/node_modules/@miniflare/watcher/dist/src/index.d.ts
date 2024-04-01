export declare class Watcher {
    #private;
    constructor(callback: WatcherCallback, options?: WatcherOptions);
    watch(paths: string | Iterable<string>): void;
    unwatch(paths: string | Iterable<string>): void;
    dispose(): void;
}

export declare type WatcherCallback = (path: string) => void;

export declare interface WatcherOptions {
    debounce?: number;
    pollInterval?: number;
    createPollInterval?: number;
    forceRecursive?: boolean;
}

export { }
