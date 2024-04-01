/// <reference types="node" />
import { BaseHashReader } from '../base/hash-reader';
/**
 * A hash reader for WebAssembly targets.
 */
export declare class NodeHashReader extends BaseHashReader<Buffer> {
    /**
     * Converts first 32 bytes of the hash to a string with the given encoding.
     */
    toString(encoding?: BufferEncoding): string;
    /**
     * Converts first 32 bytes of the hash to an array.
     */
    toBuffer(): Buffer;
    protected alloc(bytes: number): Buffer;
}
