import { BaseHashInput, IBaseHashOptions } from '../base/hash-fn';
import { Hash } from './hash';
/**
 * Input used for browser-based hashes.
 */
export declare type HashInput = BaseHashInput | string;
/**
 * @hidden
 */
export declare const normalizeInput: (input: import("..").HashInput) => Uint8Array;
/**
 * Returns a blake3 hash of the input.
 */
export declare function hash(input: HashInput, { length }?: IBaseHashOptions): Hash;
/**
 * Given cryptographic key material  and a context string, services a subkey of
 * any length. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.derive_key.html}
 * for more information.
 */
export declare function deriveKey(context: string, material: HashInput, { length }?: IBaseHashOptions): Hash;
/**
 * The keyed hash function. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.keyed_hash.html}.
 */
export declare function keyedHash(key: Uint8Array, input: HashInput, { length }?: IBaseHashOptions): Hash;
