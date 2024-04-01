import { Clock } from '@miniflare/shared';
import { LocalStorage } from '@miniflare/storage-memory';
import { MiniflareError } from '@miniflare/shared';
import { Range } from '@miniflare/shared';
import { RangeStoredValueMeta } from '@miniflare/shared';
import { SqliteDB } from '@miniflare/shared';
import { StoredKeyMeta } from '@miniflare/shared';
import { StoredMeta } from '@miniflare/shared';
import { StoredValueMeta } from '@miniflare/shared';

export declare interface FileMeta<Meta = unknown> extends StoredMeta<Meta> {
    key?: string;
}

export declare class FileStorage extends LocalStorage {
    private readonly sanitise;
    protected readonly root: string;
    private sqliteDB?;
    constructor(root: string, sanitise?: boolean, clock?: Clock);
    private keyPath;
    private meta;
    hasMaybeExpired(key: string): Promise<StoredMeta | undefined>;
    headMaybeExpired<Meta>(key: string): Promise<FileMeta<Meta> | undefined>;
    getMaybeExpired<Meta>(key: string): Promise<StoredValueMeta<Meta> | undefined>;
    getSqliteDatabase(): Promise<SqliteDB>;
    getRangeMaybeExpired<Meta = unknown>(key: string, { offset: _offset, length: _length, suffix }: Range): Promise<RangeStoredValueMeta<Meta> | undefined>;
    put<Meta = unknown>(key: string, { value, expiration, metadata }: StoredValueMeta<Meta>): Promise<void>;
    deleteMaybeExpired(key: string): Promise<boolean>;
    listAllMaybeExpired<Meta>(): Promise<StoredKeyMeta<Meta>[]>;
}

export declare class FileStorageError extends MiniflareError<FileStorageErrorCode> {
}

export declare type FileStorageErrorCode = "ERR_TRAVERSAL" | "ERR_NAMESPACE_KEY_CHILD";

export { }
