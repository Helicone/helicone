import { BaseHash as BaseHasher } from '../base/index';
import { HashInput } from './hash-fn';
import { BrowserEncoding } from './encoding';
import { IBaseHashOptions } from '../base/hash-fn';
import { BrowserHashReader } from './hash-reader';
import { IInternalReader } from '../base/hash-reader';
import { Hash } from './hash';
/**
 * @inheritdoc
 */
export declare class BrowserHasher extends BaseHasher<Hash, IInternalReader, BrowserHashReader> {
    /**
     * @inheritdoc
     * @override
     */
    update(data: HashInput): this;
    /**
     * Returns a digest of the hash with the given encoding.
     */
    digest(options?: IBaseHashOptions): Hash;
    digest(encoding: undefined, options: IBaseHashOptions): Hash;
    digest(encoding: BrowserEncoding, options?: IBaseHashOptions): string;
}
/**
 * A Node.js crypto-like createHash method.
 */
export declare const createHash: () => BrowserHasher;
/**
 * A Node.js crypto-like createHash method.
 */
export declare const createKeyed: (key: Uint8Array) => BrowserHasher;
