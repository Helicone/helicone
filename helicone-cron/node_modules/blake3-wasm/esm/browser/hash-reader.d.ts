import { BaseHashReader } from '../base/hash-reader';
import { BrowserEncoding } from './encoding';
import { Hash } from './hash';
/**
 * A hash reader for WebAssembly targets.
 */
export declare class BrowserHashReader extends BaseHashReader<Hash> {
    /**
     * Converts first 32 bytes of the hash to a string with the given encoding.
     */
    toString(encoding?: BrowserEncoding): string;
    /**
     * Converts first 32 bytes of the hash to an array.
     */
    toArray(): Hash;
    protected alloc(bytes: number): Hash;
}
