/// <reference types="node" />

import { BindingsPlugin } from '@miniflare/core';
import { BuildPlugin } from '@miniflare/core';
import { CachePlugin } from '@miniflare/cache';
import { CacheStorage } from '@miniflare/cache';
import { CorePlugin } from '@miniflare/core';
import { CorePluginSignatures } from '@miniflare/core';
import { CronScheduler } from '@miniflare/scheduler';
import { D1Plugin } from '@miniflare/d1';
import { DurableObjectId } from '@miniflare/durable-objects';
import { DurableObjectNamespace } from '@miniflare/durable-objects';
import { DurableObjectsPlugin } from '@miniflare/durable-objects';
import { DurableObjectStorage } from '@miniflare/durable-objects';
import { HTMLRewriterPlugin } from '@miniflare/html-rewriter';
import http from 'http';
import { HTTPPlugin } from '@miniflare/http-server';
import https from 'https';
import type IORedis from 'ioredis';
import { KVNamespace } from '@miniflare/kv';
import { KVPlugin } from '@miniflare/kv';
import { Log } from '@miniflare/shared';
import { LogLevel } from '@miniflare/shared';
import type { MemoryStorage } from '@miniflare/storage-memory';
import { MiniflareCore } from '@miniflare/core';
import { MiniflareCoreOptions } from '@miniflare/core';
import { QueuesPlugin } from '@miniflare/queues';
import { R2Bucket } from '@miniflare/r2';
import { R2Plugin } from '@miniflare/r2';
import { Request } from '@miniflare/core';
import { RequestInfo } from '@miniflare/core';
import { RequestInit } from '@miniflare/core';
import { Response } from '@miniflare/core';
import { SchedulerPlugin } from '@miniflare/scheduler';
import { SitesPlugin } from '@miniflare/sites';
import { Storage } from '@miniflare/shared';
import { StorageFactory } from '@miniflare/shared';
import { WebSocketPlugin } from '@miniflare/web-sockets';

export { Log }

export { LogLevel }

export declare class Miniflare extends MiniflareCore<Plugins> {
    #private;
    constructor(options?: MiniflareOptions);
    dispose(): Promise<void>;
    getKVNamespace(namespace: string): Promise<KVNamespace>;
    getR2Bucket(bucket: string): Promise<R2Bucket>;
    getCaches(): Promise<CacheStorage>;
    getDurableObjectNamespace(objectName: string): Promise<DurableObjectNamespace>;
    getDurableObjectStorage(id: DurableObjectId): Promise<DurableObjectStorage>;
    createServer(options?: http.ServerOptions & https.ServerOptions): Promise<http.Server | https.Server>;
    startServer(options?: http.ServerOptions & https.ServerOptions): Promise<http.Server | https.Server>;
    startScheduler(): Promise<CronScheduler<Plugins>>;
    startREPL(): Promise<void>;
    getOpenURL(): Promise<string | undefined>;
}

export declare type MiniflareOptions = Omit<MiniflareCoreOptions<Plugins>, "debug" | "verbose" | "updateCheck"> & {
    log?: Log;
    sourceMap?: boolean;
    scriptRequired?: boolean;
};

export declare const PLUGINS: {
    CorePlugin: typeof CorePlugin;
    HTTPPlugin: typeof HTTPPlugin;
    SchedulerPlugin: typeof SchedulerPlugin;
    BuildPlugin: typeof BuildPlugin;
    KVPlugin: typeof KVPlugin;
    D1Plugin: typeof D1Plugin;
    R2Plugin: typeof R2Plugin;
    DurableObjectsPlugin: typeof DurableObjectsPlugin;
    CachePlugin: typeof CachePlugin;
    SitesPlugin: typeof SitesPlugin;
    QueuesPlugin: typeof QueuesPlugin;
    HTMLRewriterPlugin: typeof HTMLRewriterPlugin;
    WebSocketPlugin: typeof WebSocketPlugin;
    BindingsPlugin: typeof BindingsPlugin;
};

export declare type Plugins = typeof PLUGINS;

export { Request }

export { RequestInfo }

export { RequestInit }

export { Response }

export declare function startREPL<Plugins extends CorePluginSignatures>(mf: MiniflareCore<Plugins>): Promise<void>;

export declare function updateCheck({ pkg, lastCheckFile, log, now, registry, }: {
    pkg: {
        name: string;
        version: string;
    };
    lastCheckFile: string;
    log: Log;
    now?: number;
    registry?: string;
}): Promise<void>;

export declare class VariedStorageFactory implements StorageFactory {
    private readonly memoryStorages;
    private readonly redisConnections;
    constructor(memoryStorages?: Map<string, MemoryStorage>, redisConnections?: Map<string, IORedis.Redis>);
    storage(namespace: string, persist?: boolean | string): Storage;
    dispose(): Promise<void>;
}

export { }
