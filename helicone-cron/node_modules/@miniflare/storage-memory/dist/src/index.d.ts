import { Awaitable } from '@miniflare/shared';
import { Clock } from '@miniflare/shared';
import { Range } from '@miniflare/shared';
import { RangeStoredValueMeta } from '@miniflare/shared';
import { SqliteDB } from '@miniflare/shared';
import { Storage } from '@miniflare/shared';
import { StorageListOptions } from '@miniflare/shared';
import { StorageListResult } from '@miniflare/shared';
import { StoredKey } from '@miniflare/shared';
import { StoredKeyMeta } from '@miniflare/shared';
import { StoredMeta } from '@miniflare/shared';
import { StoredValueMeta } from '@miniflare/shared';

export declare function cloneMetadata<Meta>(metadata?: unknown): Meta | undefined;

export declare function listFilterMatch(options: StorageListOptions | undefined, name: string): boolean;

export declare function listPaginate<Key extends StoredKey>(options: StorageListOptions | undefined, keys: Key[]): StorageListResult<Key>;

export declare abstract class LocalStorage extends Storage {
    private readonly clock;
    protected constructor(clock?: Clock);
    abstract hasMaybeExpired(key: string): Awaitable<StoredMeta | undefined>;
    abstract headMaybeExpired<Meta>(key: string): Awaitable<StoredMeta<Meta> | undefined>;
    abstract getMaybeExpired<Meta>(key: string): Awaitable<StoredValueMeta<Meta> | undefined>;
    abstract getRangeMaybeExpired<Meta>(key: string, range: Range): Awaitable<RangeStoredValueMeta<Meta> | undefined>;
    abstract deleteMaybeExpired(key: string): Awaitable<boolean>;
    abstract listAllMaybeExpired<Meta>(): Awaitable<StoredKeyMeta<Meta>[]>;
    private expired;
    has(key: string): Promise<boolean>;
    head<Meta = unknown>(key: string): Promise<StoredMeta<Meta> | undefined>;
    get<Meta = unknown>(key: string): Promise<StoredValueMeta<Meta> | undefined>;
    getRange<Meta = unknown>(key: string, range?: Range): Promise<RangeStoredValueMeta<Meta> | undefined>;
    delete(key: string): Promise<boolean>;
    list<Meta = unknown>(options?: StorageListOptions): Promise<StorageListResult<StoredKeyMeta<Meta>>>;
}

export declare class MemoryStorage extends LocalStorage {
    protected map: Map<string, StoredValueMeta<unknown>>;
    protected sqliteDB?: SqliteDB;
    constructor(map?: Map<string, StoredValueMeta<unknown>>, clock?: Clock);
    hasMaybeExpired(key: string): StoredMeta | undefined;
    headMaybeExpired<Meta>(key: string): StoredMeta<Meta> | undefined;
    getMaybeExpired<Meta>(key: string): StoredValueMeta<Meta> | undefined;
    getRangeMaybeExpired<Meta>(key: string, { offset, length, suffix }: Range): RangeStoredValueMeta<Meta> | undefined;
    put<Meta = unknown>(key: string, value: StoredValueMeta<Meta>): void;
    deleteMaybeExpired(key: string): boolean;
    private static entryToStoredKey;
    listAllMaybeExpired<Meta>(): StoredKeyMeta<Meta>[];
    getSqliteDatabase(): Promise<SqliteDB>;
}

export { }
