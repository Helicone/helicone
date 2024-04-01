/// <reference types="node" />
import { BaseHashInput, IBaseHashOptions } from '../base/hash-fn';
/**
 * Input used for node-based hashes.
 */
export declare type HashInput = BaseHashInput | string;
/**
 * @hidden
 */
export declare const normalizeInput: (input: HashInput, encoding?: "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex" | undefined) => Uint8Array;
/**
 * Returns a blake3 hash of the input, returning the binary hash data.
 */
export declare function hash(input: HashInput, { length }?: IBaseHashOptions): Buffer | string;
/**
 * Given cryptographic key material  and a context string, services a subkey of
 * any length. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.derive_key.html}
 * for more information.
 */
export declare function deriveKey(context: string, material: HashInput, { length }?: IBaseHashOptions): Buffer;
/**
 * The keyed hash function. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.keyed_hash.html}.
 */
export declare function keyedHash(key: Buffer, input: HashInput, { length }?: IBaseHashOptions): Buffer;
