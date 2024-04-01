/// <reference types="node" />

import { Blob as Blob_2 } from 'buffer';
import { Headers } from 'undici';
import { Plugin } from '@miniflare/shared';
import { PluginContext } from '@miniflare/shared';
import { ReadableStream } from 'stream/web';
import { SetupResult } from '@miniflare/shared';
import { Storage } from '@miniflare/shared';
import { StorageFactory } from '@miniflare/shared';

export declare function createHash(input: Uint8Array): string;

export declare function createVersion(): string;

export declare interface InternalR2BucketOptions {
    blockGlobalAsyncIO?: boolean;
}

export declare function parseHttpMetadata(httpMetadata?: R2HTTPMetadata | Headers): R2HTTPMetadata;

export declare function parseOnlyIf(onlyIf?: R2ConditionalUnparsed | R2Conditional | Headers): R2Conditional;

export declare function parseR2ObjectMetadata(meta: R2ObjectMetadata): void;

export declare class R2Bucket {
    #private;
    constructor(storage: Storage, { blockGlobalAsyncIO }?: InternalR2BucketOptions);
    head(key: string): Promise<R2Object | null>;
    /**
     * Returns R2Object on a failure of the conditional specified in onlyIf.
     */
    get(key: string): Promise<R2ObjectBody | null>;
    get(key: string, options: R2GetOptions): Promise<R2ObjectBody | R2Object | null>;
    put(key: string, value: R2PutValueType, options?: R2PutOptions): Promise<R2Object | null>;
    delete(key: string): Promise<void>;
    list(listOptions?: R2ListOptions): Promise<R2Objects>;
}

export declare interface R2Conditional {
    etagMatches?: string | string[];
    etagDoesNotMatch?: string | string[];
    uploadedBefore?: Date;
    uploadedAfter?: Date;
}

export declare interface R2ConditionalUnparsed {
    etagMatches?: string | string[];
    etagDoesNotMatch?: string | string[];
    uploadedBefore?: string | Date;
    uploadedAfter?: string | Date;
}

export declare interface R2GetOptions {
    onlyIf?: R2Conditional | Headers;
    range?: R2Range;
}

/**
 * Metadata that's automatically rendered into R2 HTTP API endpoints.
 * ```
 * * contentType -> content-type
 * * contentLanguage -> content-language
 * etc...
 * ```
 * This data is echoed back on GET responses based on what was originally
 * assigned to the object (and can typically also be overriden when issuing
 * the GET request).
 */
export declare interface R2HTTPMetadata {
    contentType?: string;
    contentLanguage?: string;
    contentDisposition?: string;
    contentEncoding?: string;
    cacheControl?: string;
    cacheExpiry?: Date;
}

export declare interface R2ListOptions {
    limit?: number;
    prefix?: string;
    cursor?: string;
    startAfter?: string;
    delimiter?: string;
    include?: R2ListOptionsInclude;
}

export declare type R2ListOptionsInclude = ("httpMetadata" | "customMetadata")[];

/**
 * R2Object is created when you PUT an object into an R2 bucket.
 * R2Object represents the metadata of an object based on the information
 * provided by the uploader. Every object that you PUT into an R2 bucket
 * will have an R2Object created.
 */
export declare class R2Object {
    readonly key: string;
    readonly version: string;
    readonly size: number;
    readonly etag: string;
    readonly httpEtag: string;
    readonly uploaded: Date;
    readonly httpMetadata: R2HTTPMetadata;
    readonly customMetadata: Record<string, string>;
    readonly range?: R2Range;
    constructor(metadata: R2ObjectMetadata);
    writeHttpMetadata(headers: Headers): void;
}

export declare class R2ObjectBody extends R2Object {
    readonly body: ReadableStream<Uint8Array>;
    readonly bodyUsed: boolean;
    constructor(metadata: R2ObjectMetadata, value: Uint8Array);
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
    json<T>(): Promise<T>;
    blob(): Promise<Blob_2>;
}

export declare interface R2ObjectMetadata {
    key: string;
    version: string;
    size: number;
    etag: string;
    httpEtag: string;
    uploaded: Date;
    httpMetadata: R2HTTPMetadata;
    customMetadata: Record<string, string>;
    range?: R2Range;
}

export declare interface R2Objects {
    objects: R2Object[];
    truncated: boolean;
    cursor?: string;
    delimitedPrefixes: string[];
}

export declare interface R2Options {
    r2Buckets?: string[];
    r2Persist?: boolean | string;
}

export declare class R2Plugin extends Plugin<R2Options> implements R2Options {
    #private;
    r2Buckets?: string[];
    r2Persist?: boolean | string;
    constructor(ctx: PluginContext, options?: R2Options);
    getBucket(storage: StorageFactory, bucket: string, blockGlobalAsyncIO?: boolean): R2Bucket;
    setup(storageFactory: StorageFactory): SetupResult;
}

export declare interface R2PutOptions {
    onlyIf?: R2Conditional | Headers;
    httpMetadata?: R2HTTPMetadata | Headers;
    customMetadata?: Record<string, string>;
    md5?: ArrayBuffer | string;
}

export declare type R2PutValueType = ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob_2;

export declare interface R2Range {
    offset?: number;
    length?: number;
    suffix?: number;
}

export declare function testR2Conditional(conditional: R2Conditional, metadata?: R2ObjectMetadata): boolean;

/* Excluded from this release type: _valueToArray */

export { }
