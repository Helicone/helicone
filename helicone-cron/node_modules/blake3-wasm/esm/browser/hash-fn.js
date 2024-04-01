import { inputToArray, defaultHashLength } from '../base/hash-fn.js';
import { Hash } from './hash.js';
import { getWasm } from './wasm.js';
const textEncoder = new TextEncoder();
/**
 * @hidden
 */
export const normalizeInput = (input) => inputToArray(typeof input === 'string' ? textEncoder.encode(input) : input);
/**
 * Returns a blake3 hash of the input.
 */
export function hash(input, { length = defaultHashLength } = {}) {
    const result = new Hash(length);
    getWasm().hash(normalizeInput(input), result);
    return result;
}
/**
 * Given cryptographic key material  and a context string, services a subkey of
 * any length. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.derive_key.html}
 * for more information.
 */
export function deriveKey(context, material, { length = defaultHashLength } = {}) {
    const derive = getWasm().create_derive(context);
    derive.update(normalizeInput(material));
    const result = new Hash(length);
    derive.digest(result);
    return result;
}
/**
 * The keyed hash function. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.keyed_hash.html}.
 */
export function keyedHash(key, input, { length = defaultHashLength } = {}) {
    if (key.length !== 32) {
        throw new Error(`key provided to keyedHash must be 32 bytes, got ${key.length}`);
    }
    const derive = getWasm().create_keyed(key);
    derive.update(normalizeInput(input));
    const result = new Hash(length);
    derive.digest(result);
    return result;
}
//# sourceMappingURL=hash-fn.js.map