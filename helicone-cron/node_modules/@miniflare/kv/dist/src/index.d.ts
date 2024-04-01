import { Clock } from '@miniflare/shared';
import { Plugin } from '@miniflare/shared';
import { PluginContext } from '@miniflare/shared';
import { ReadableStream } from 'stream/web';
import { SetupResult } from '@miniflare/shared';
import { Storage } from '@miniflare/shared';
import { StorageFactory } from '@miniflare/shared';
import { StoredKeyMeta } from '@miniflare/shared';

export declare interface InternalKVNamespaceOptions {
    clock?: Clock;
    blockGlobalAsyncIO?: boolean;
}

export declare type KVGetOptions<Type extends KVGetValueType = KVGetValueType> = {
    type: Type;
    cacheTtl?: number;
};

export declare type KVGetValueType = "text" | "json" | "arrayBuffer" | "stream";

export declare interface KVListOptions {
    prefix?: string;
    limit?: number;
    cursor?: string;
}

export declare interface KVListResult<Meta = unknown> {
    keys: StoredKeyMeta<Meta>[];
    cursor: string;
    list_complete: boolean;
}

export declare class KVNamespace {
    #private;
    constructor(storage: Storage, { clock, blockGlobalAsyncIO, }?: InternalKVNamespaceOptions);
    get(key: string, options?: "text" | Partial<KVGetOptions<"text">>): KVValue<string>;
    get<Value = unknown>(key: string, options: "json" | KVGetOptions<"json">): KVValue<Value>;
    get(key: string, options: "arrayBuffer" | KVGetOptions<"arrayBuffer">): KVValue<ArrayBuffer>;
    get(key: string, options: "stream" | KVGetOptions<"stream">): KVValue<ReadableStream<Uint8Array>>;
    getWithMetadata<Metadata = unknown>(key: string, options?: "text" | Partial<KVGetOptions<"text">>): KVValueMeta<string, Metadata>;
    getWithMetadata<Value = unknown, Metadata = unknown>(key: string, options: "json" | KVGetOptions<"json">): KVValueMeta<Value, Metadata>;
    getWithMetadata<Metadata = unknown>(key: string, options: "arrayBuffer" | KVGetOptions<"arrayBuffer">): KVValueMeta<ArrayBuffer, Metadata>;
    getWithMetadata<Metadata = unknown>(key: string, options: "stream" | KVGetOptions<"stream">): KVValueMeta<ReadableStream<Uint8Array>, Metadata>;
    put<Meta = unknown>(key: string, value: KVPutValueType, options?: KVPutOptions<Meta>): Promise<void>;
    delete(key: string): Promise<void>;
    list<Meta = unknown>({ prefix, limit, cursor, }?: KVListOptions): Promise<KVListResult<Meta>>;
}

export declare interface KVOptions {
    kvNamespaces?: string[];
    kvPersist?: boolean | string;
}

export declare class KVPlugin extends Plugin<KVOptions> implements KVOptions {
    #private;
    kvNamespaces?: string[];
    kvPersist?: boolean | string;
    constructor(ctx: PluginContext, options?: KVOptions);
    getNamespace(storage: StorageFactory, namespace: string, blockGlobalAsyncIO?: boolean): KVNamespace;
    setup(storageFactory: StorageFactory): SetupResult;
}

export declare interface KVPutOptions<Meta = unknown> {
    expiration?: string | number;
    expirationTtl?: string | number;
    metadata?: Meta;
}

export declare type KVPutValueType = string | ArrayBuffer | ArrayBufferView | ReadableStream;

export declare type KVValue<Value> = Promise<Value | null>;

export declare type KVValueMeta<Value, Meta> = Promise<{
    value: Value | null;
    metadata: Meta | null;
}>;

export { }
