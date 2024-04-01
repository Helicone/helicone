import { InternalKVNamespaceOptions } from '@miniflare/kv';
import { KVGetOptions } from '@miniflare/kv';
import { KVGetValueType } from '@miniflare/kv';
import { KVListOptions } from '@miniflare/kv';
import { KVListResult } from '@miniflare/kv';
import { KVNamespace } from '@miniflare/kv';
import { KVPutOptions } from '@miniflare/kv';
import { KVPutValueType } from '@miniflare/kv';
import { KVValue } from '@miniflare/kv';
import { KVValueMeta } from '@miniflare/kv';
import { Matcher } from '@miniflare/shared';
import { Plugin } from '@miniflare/shared';
import { PluginContext } from '@miniflare/shared';
import { SetupResult } from '@miniflare/shared';
import { Storage } from '@miniflare/shared';

export declare class FilteredKVNamespace extends KVNamespace {
    #private;
    constructor(storage: Storage, options?: FilteredKVStorageNamespaceOptions, internalOptions?: InternalKVNamespaceOptions);
    get(key: string, options?: KVGetValueType | Partial<KVGetOptions>): KVValue<any>;
    getWithMetadata<Meta = unknown>(key: string, options?: KVGetValueType | Partial<KVGetOptions>): KVValueMeta<any, Meta>;
    put(key: string, value: KVPutValueType, options?: KVPutOptions): Promise<void>;
    delete(key: string): Promise<void>;
    list<Meta = unknown>(options?: KVListOptions): Promise<KVListResult<Meta>>;
}

export declare interface FilteredKVStorageNamespaceOptions {
    readOnly?: boolean;
    map?: KeyMapper;
    include?: Matcher;
    exclude?: Matcher;
}

export declare interface KeyMapper {
    lookup(key: string): string;
    reverseLookup(key: string): string;
}

export declare interface SitesOptions {
    sitePath?: string;
    siteInclude?: string[];
    siteExclude?: string[];
}

export declare class SitesPlugin extends Plugin<SitesOptions> implements SitesOptions {
    #private;
    sitePath?: string;
    siteInclude?: string[];
    siteExclude?: string[];
    constructor(ctx: PluginContext, options?: SitesOptions);
    setup(): Promise<SetupResult>;
}

export { }
