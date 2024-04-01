import { Clock } from '@miniflare/shared';
import { Headers } from 'undici';
import { Log } from '@miniflare/shared';
import { MiniflareError } from '@miniflare/shared';
import { Plugin } from '@miniflare/shared';
import { PluginContext } from '@miniflare/shared';
import { RequestInfo } from '@miniflare/core';
import { Response } from 'undici';
import { Response as Response_2 } from '@miniflare/core';
import { SetupResult } from '@miniflare/shared';
import { Storage } from '@miniflare/shared';
import { StorageFactory } from '@miniflare/shared';

export declare class Cache implements CacheInterface {
    #private;
    constructor(storage: Storage, { formDataFiles, clock, blockGlobalAsyncIO, }?: InternalCacheOptions);
    put(req: RequestInfo, res: Response | Response_2): Promise<undefined>;
    match(req: RequestInfo, options?: CacheMatchOptions): Promise<Response_2 | undefined>;
    delete(req: RequestInfo, options?: CacheMatchOptions): Promise<boolean>;
}

export declare interface CachedMeta {
    status: number;
    headers: [string, string][];
}

export declare class CacheError extends MiniflareError<CacheErrorCode> {
}

export declare type CacheErrorCode = "ERR_RESERVED" | "ERR_DESERIALIZATION";

export declare interface CacheInterface {
    put(req: RequestInfo, res: Response | Response_2): Promise<undefined>;
    match(req: RequestInfo, options?: CacheMatchOptions): Promise<Response_2 | undefined>;
    delete(req: RequestInfo, options?: CacheMatchOptions): Promise<boolean>;
}

export declare interface CacheMatchOptions {
    ignoreMethod?: boolean;
}

export declare interface CacheOptions {
    cache?: boolean;
    cachePersist?: boolean | string;
    cacheWarnUsage?: boolean;
}

export declare class CachePlugin extends Plugin<CacheOptions> implements CacheOptions {
    #private;
    cache?: boolean;
    cachePersist?: boolean | string;
    cacheWarnUsage?: boolean;
    constructor(ctx: PluginContext, options?: CacheOptions);
    setup(storageFactory: StorageFactory): SetupResult;
    getCaches(): CacheStorage;
}

export declare class CacheStorage {
    #private;
    constructor(options: CacheOptions, log: Log, storageFactory: StorageFactory, internalOptions: InternalCacheOptions);
    get default(): CacheInterface;
    open(cacheName: string): Promise<CacheInterface>;
}

/* Excluded from this release type: _getRangeResponse */

export declare interface InternalCacheOptions {
    formDataFiles?: boolean;
    clock?: Clock;
    blockGlobalAsyncIO?: boolean;
}

export declare class NoOpCache implements CacheInterface {
    put(_req: RequestInfo, _res: Response | Response_2): Promise<undefined>;
    match(_req: RequestInfo, _options?: CacheMatchOptions): Promise<Response_2 | undefined>;
    delete(_req: RequestInfo, _options?: CacheMatchOptions): Promise<boolean>;
}

/* Excluded from this release type: _parseRanges */

export { }
