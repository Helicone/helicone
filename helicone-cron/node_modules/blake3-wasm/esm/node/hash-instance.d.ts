/// <reference types="node" />
import { HashInput } from './hash-fn';
import { IHasher, IInternalHash, IHasherDigestOptions } from '../base/index';
import { Transform, TransformCallback } from 'stream';
import { IBaseHashOptions } from '../base/hash-fn';
import { NodeHashReader } from './hash-reader';
export interface INodeHash extends IHasher<Buffer> {
    /**
     * @inheritdoc
     * @override
     */
    update(data: HashInput, encoding?: BufferEncoding): this;
    /**
     * @inheritdoc
     * @override
     */
    digest(options?: IBaseHashOptions): Buffer;
    /**
     * Returns a digest of the hash with the given set of hash options.
     */
    digest(encoding: undefined, options: IBaseHashOptions): Buffer;
    /**
     * Returns a digest of the hash with the given encoding.
     */
    digest(encoding: BufferEncoding, options?: IBaseHashOptions): string;
}
/**
 * @inheritdoc
 */
export declare class NodeHash<Reader> extends Transform implements IHasher<Buffer> {
    private readonly hash;
    constructor(implementation: IInternalHash<Reader>, getReader: (r: Reader) => NodeHashReader);
    /**
     * @reader
     */
    reader(options?: {
        dispose?: boolean;
    }): NodeHashReader;
    /**
     * @inheritdoc
     */
    update(data: HashInput, encoding?: BufferEncoding): this;
    /**
     * @inheritdoc
     */
    digest(encoding?: IHasherDigestOptions): Buffer;
    digest(encoding: undefined, options: IHasherDigestOptions): Buffer;
    digest(encoding: BufferEncoding, options?: IHasherDigestOptions): string;
    /**
     * @inheritdoc
     */
    dispose(): void;
    /**
     * @inheritdoc
     * @hidden
     */
    _transform(chunk: Buffer | string, encoding: string, callback: TransformCallback): void;
    /**
     * @inheritdoc
     * @hidden
     */
    _flush(callback: TransformCallback): void;
}
/**
 * A Node.js crypto-like createHash method.
 */
export declare const createHash: () => NodeHash<import("../../dist/wasm/nodejs/blake3_js").HashReader>;
/**
 * Construct a new Hasher for the keyed hash function.
 */
export declare const createKeyed: (key: Buffer) => NodeHash<import("../../dist/wasm/nodejs/blake3_js").HashReader>;
/**
 * Construct a new Hasher for the key derivation function.
 */
export declare const createDeriveKey: (context: string) => NodeHash<import("../../dist/wasm/nodejs/blake3_js").HashReader>;
